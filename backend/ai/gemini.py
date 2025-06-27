import os
import typing
import logging
import inspect
from google import genai
from google.genai.types import Content, Tool, GenerateContentConfig, Part, AutomaticFunctionCallingConfig

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Agent:   
    def __init__(self,
                 model: str,
                 name: str = "GeminiAgent",
                 api_key: typing.Optional[str] = None,
                 system_instruction: typing.Optional[str] = None,
                 initial_history: typing.Optional[typing.List[Content]] = None,
                 generation_config: typing.Optional[typing.Dict[str, typing.Any]] = None,
                 tools: typing.Optional[typing.List[typing.Callable]] = None,
                 memory: bool = False,
                 last_n_messages: typing.Optional[typing.List[typing.Dict]] = None,
                 **kwargs: typing.Any):
        """Initialize the Agent with model configuration and optional function calling.
        
        Args:
            memory: If True, maintains conversation history during script execution.
                   If False, each call is independent. Memory is cleared when script ends.
            last_n_messages: List of recent messages to inject into memory. Each dict should have
                           'role' and 'content' keys. Used for loading external conversation history.
        """
        self.name = name
        self.model = model
        self.memory = memory
        self._api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        if not self._api_key:
            raise ValueError("API key not provided and GOOGLE_API_KEY environment variable not set.")

        self._client = genai.Client(api_key=self._api_key)
        self._default_config = generation_config or {}
        self._system_instruction = system_instruction
        self._initial_history = initial_history
        self._last_n_messages = last_n_messages
        self._chat_session = None
        self._other_kwargs = kwargs
        self._tools = tools or []
        self._tool_declarations = self._create_tool_declarations()
        
        # Initialize chat session if memory is enabled
        if self.memory:
            self._initialize_chat_session()

    def _log(self, msg: str, level: str = "info"):
        """Unified logging with optional console output."""
        getattr(logger, level)(msg)

    def _convert_messages_to_content(self, messages: typing.List[typing.Dict]) -> typing.List[Content]:
        """Convert list of message dicts to Content objects for Gemini API."""
        content_list = []
        for message in messages:
            if 'role' in message and 'content' in message:
                content = Content(
                    role=message['role'],
                    parts=[Part(text=message['content'])]
                )
                content_list.append(content)
            else:
                self._log(f"Skipping invalid message format: {message}", "warning")
        return content_list

    def _initialize_chat_session(self):
        """Initialize chat session for memory-enabled conversations."""
        config = self._default_config.copy()
        if self._system_instruction:
            config['system_instruction'] = self._system_instruction
            
        # Create tools config if tools are available
        if self._tool_declarations:
            tools = [Tool(function_declarations=self._tool_declarations)]
            config['tools'] = tools
            # Enable automatic function calling for better user experience
            config['automatic_function_calling'] = AutomaticFunctionCallingConfig(disable=False)
        
        # Prepare history - combine initial_history with last_n_messages if provided
        history = self._initial_history or []
        
        # If last_n_messages is provided, convert and add to history
        if self._last_n_messages:
            self._log(f"Injecting {len(self._last_n_messages)} messages into chat session")
            converted_messages = self._convert_messages_to_content(self._last_n_messages)
            history = history + converted_messages
        
        self._chat_session = self._client.chats.create(
            model=self.model,
            history=history,
            config=config
        )
        self._log(f"Chat session initialized with memory enabled (history length: {len(history)})")

    def _create_tool_declarations(self) -> typing.List[typing.Dict]:
        """Convert Python functions to Gemini function declarations."""
        declarations = []
        for tool in self._tools:
            declaration = self._function_to_declaration(tool)
            declarations.append(declaration)
        return declarations

    def _function_to_declaration(self, func: typing.Callable) -> typing.Dict:
        """Convert a Python function to a Gemini function declaration."""
        sig = inspect.signature(func)
        doc = inspect.getdoc(func) or f"Function {func.__name__}"
        
        properties = {}
        required = []
        
        for param_name, param in sig.parameters.items():
            param_type = "string"  # default
            if param.annotation != inspect.Parameter.empty:
                if param.annotation == int:
                    param_type = "integer"
                elif param.annotation == float:
                    param_type = "number"
                elif param.annotation == bool:
                    param_type = "boolean"
                elif param.annotation == str:
                    param_type = "string"
            
            properties[param_name] = {
                "type": param_type,
                "description": f"Parameter {param_name}"
            }
            
            if param.default == inspect.Parameter.empty:
                required.append(param_name)
        
        return {
            "name": func.__name__,
            "description": doc,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required
            }
        }

    def tool_call(self, prompt: str) -> str:
        """Send a message that may trigger a tool call and handle the complete handshake."""
        self._log(f"Tool call request: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
        
        if self.memory and self._chat_session:
            # Use memory-enabled chat session for tool calls
            try:
                response = self._chat_session.send_message(prompt)
                
                # Check if there are function calls in the response
                function_calls = []
                if hasattr(response, 'candidates') and response.candidates:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'function_call') and part.function_call:
                            function_calls.append(part.function_call)
                
                if function_calls:
                    self._log(f"Function calls detected: {len(function_calls)}")
                    
                    # Execute all function calls and collect results
                    function_results = []
                    for function_call in function_calls:
                        function_name = function_call.name
                        function_args = dict(function_call.args)
                        
                        # Find the function in our tools
                        target_function = None
                        for tool in self._tools:
                            if tool.__name__ == function_name:
                                target_function = tool
                                break
                        
                        if target_function:
                            self._log(f"Executing function: {function_name} with args: {function_args}")
                            function_result = target_function(**function_args)
                            function_results.append((function_name, function_result))
                        else:
                            self._log(f"Function {function_name} not found in tools", "error")
                            function_results.append((function_name, f"Error: Function {function_name} not found"))
                    
                    # Send all results back to the chat session
                    return self._send_function_results_memory(function_results)
                else:
                    # No function call, return text response
                    if response.text is not None and response.text.strip():
                        return response.text
                    else:
                        # Check for text parts
                        text_parts = []
                        if hasattr(response, 'candidates') and response.candidates:
                            for part in response.candidates[0].content.parts:
                                if hasattr(part, 'text') and part.text and part.text.strip():
                                    text_parts.append(part.text)
                        
                        if text_parts:
                            return ''.join(text_parts)
                        else:
                            return "No response generated."
                        
            except Exception as e:
                self._log(f"Error in memory-enabled tool call: {e}", "error")
                raise
        else:
            # Use stateless approach for tool calls when memory is disabled
            user_content = Content(role="user", parts=[Part(text=prompt)])
            conversation_contents = [user_content]
            
            # Create config with tools if available
            config = GenerateContentConfig()
            if self._tool_declarations:
                tools = [Tool(function_declarations=self._tool_declarations)]
                config.tools = tools
                config.automatic_function_calling = AutomaticFunctionCallingConfig(disable=False)
            
            try:
                # Add system instruction if available
                if self._system_instruction:
                    config.system_instruction = self._system_instruction
                    
                response = self._client.models.generate_content(
                    model=self.model,
                    contents=conversation_contents,
                    config=config
                )
                
                # Check if there are function calls (could be multiple for parallel calling)
                function_calls = []
                for part in response.candidates[0].content.parts:
                    if part.function_call:
                        function_calls.append(part.function_call)
                
                if function_calls:
                    self._log(f"Function calls detected: {len(function_calls)}")
                    
                    # Execute all function calls and collect results
                    function_results = []
                    for function_call in function_calls:
                        function_name = function_call.name
                        function_args = dict(function_call.args)
                        
                        # Find the function in our tools
                        target_function = None
                        for tool in self._tools:
                            if tool.__name__ == function_name:
                                target_function = tool
                                break
                        
                        if target_function:
                            self._log(f"Executing function: {function_name} with args: {function_args}")
                            function_result = target_function(**function_args)
                            function_results.append((function_name, function_result))
                        else:
                            self._log(f"Function {function_name} not found in tools", "error")
                            function_results.append((function_name, f"Error: Function {function_name} not found"))
                    
                    # Send all results back to model (stateless)
                    return self._send_function_results_stateless(conversation_contents, function_results)
                else:
                    # No function call, return text response
                    return response.text
                    
            except Exception as e:
                self._log(f"Error in tool call: {e}", "error")
                raise


    def chat(self, prompt: str, generation_config: typing.Optional[typing.Dict[str, typing.Any]] = None) -> str:
        """Send a message to the model and return text response"""
        self._log(f"Chat request: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
        
        if self.memory:
            # Use existing chat session for memory-enabled conversations
            if not self._chat_session:
                self._initialize_chat_session()
            
            try:
                # Apply generation config if provided
                config = None
                if generation_config:
                    config = self._default_config.copy()
                    config.update(generation_config)
                
                response = self._chat_session.send_message(
                    prompt,
                    config=config
                )
                
                return response.text
            except Exception as e:
                self._log(f"Error in memory-enabled chat: {e}", "error")
                raise
        else:
            # Create new chat session for each call when memory is disabled
            config = self._default_config.copy()
            if self._system_instruction:
                config['system_instruction'] = self._system_instruction
            
            chat_session = self._client.chats.create(
                model=self.model,
                history=self._initial_history or [],
                config=config
            )
            
            try:
                final_config = self._default_config.copy()
                if generation_config:
                    final_config.update(generation_config)
                    
                response = chat_session.send_message(
                    prompt,
                    config=final_config if final_config else None
                )
                
                return response.text
            except Exception as e:
                self._log(f"Error sending message: {e}", "error")
                raise

    def _send_function_results_memory(self, function_results: typing.List[typing.Tuple[str, typing.Any]]) -> str:
        """Send function execution results back to the chat session for memory-enabled tool calls."""
        self._log(f"Sending {len(function_results)} function results (memory)")
        
        # Create function response parts for all results
        function_response_parts = []
        for function_name, result in function_results:
            self._log(f"Function {function_name} returned: {str(result)[:200]}{'...' if len(str(result)) > 200 else ''}")
            function_response_part = Part.from_function_response(
                name=function_name,
                response={"result": result}
            )
            function_response_parts.append(function_response_part)
        
        try:
            # Send function results back to the chat session
            response = self._chat_session.send_message(function_response_parts)
            self._log(f"Response after function results - has text: {hasattr(response, 'text') and response.text is not None}")
            
            # Check if there are more function calls in the response (recursive calling)
            function_calls = []
            if hasattr(response, 'candidates') and response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        function_calls.append(part.function_call)
            
            if function_calls:
                self._log(f"Recursive function calls detected: {len(function_calls)}")
                
                # Execute all function calls and collect results
                recursive_function_results = []
                for function_call in function_calls:
                    function_name = function_call.name
                    function_args = dict(function_call.args)
                    
                    # Find the function in our tools
                    target_function = None
                    for tool in self._tools:
                        if tool.__name__ == function_name:
                            target_function = tool
                            break
                    
                    if target_function:
                        self._log(f"Executing recursive function: {function_name} with args: {function_args}")
                        function_result = target_function(**function_args)
                        recursive_function_results.append((function_name, function_result))
                    else:
                        self._log(f"Function {function_name} not found in tools", "error")
                        recursive_function_results.append((function_name, f"Error: Function {function_name} not found"))
                
                # Recursively send the new function results
                return self._send_function_results_memory(recursive_function_results)
            
            # No more function calls, check for text response
            if hasattr(response, 'text') and response.text is not None and response.text.strip():
                self._log(f"Returning response.text: {response.text[:100]}{'...' if len(response.text) > 100 else ''}")
                return response.text
            else:
                # Check for text parts in candidates
                text_parts = []
                if hasattr(response, 'candidates') and response.candidates:
                    self._log(f"Checking {len(response.candidates)} candidates for text parts")
                    for candidate in response.candidates:
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            for part in candidate.content.parts:
                                if hasattr(part, 'text') and part.text and part.text.strip():
                                    text_parts.append(part.text)
                                    self._log(f"Found text part: {part.text[:100]}{'...' if len(part.text) > 100 else ''}")
                
                if text_parts:
                    result_text = ''.join(text_parts)
                    self._log(f"Returning joined text parts: {result_text[:100]}{'...' if len(result_text) > 100 else ''}")
                    return result_text
                else:
                    self._log("No text content found in final response", "warning")
                    return "Function executed successfully, but no response was generated."
            
        except Exception as e:
            self._log(f"Error sending function results (memory): {e}", "error")
            raise

    def _send_function_results_stateless(self, conversation_contents: typing.List[Content], function_results: typing.List[typing.Tuple[str, typing.Any]]) -> str:
        """Send function execution results back to the model for stateless tool calls."""
        self._log(f"Sending {len(function_results)} function results (stateless)")
        
        # Create function response parts for all results
        function_response_parts = []
        for function_name, result in function_results:
            self._log(f"Function {function_name} returned: {str(result)[:200]}{'...' if len(str(result)) > 200 else ''}")
            function_response_part = Part.from_function_response(
                name=function_name,
                response={"result": result}
            )
            function_response_parts.append(function_response_part)
        
        # Add all function results to conversation
        function_content = Content(role="user", parts=function_response_parts)
        conversation_contents.append(function_content)
        
        # Create config with tools
        config = GenerateContentConfig()
        if self._tool_declarations:
            tools = [Tool(function_declarations=self._tool_declarations)]
            config.tools = tools
            # Disable automatic function calling for the final response to prevent loops
            config.automatic_function_calling = AutomaticFunctionCallingConfig(disable=True)
        
        # Add system instruction if available
        if self._system_instruction:
            config.system_instruction = self._system_instruction
        
        try:
            final_response = self._client.models.generate_content(
                model=self.model,
                contents=conversation_contents,
                config=config
            )
            
            self._log(f"Final response - has text: {hasattr(final_response, 'text') and final_response.text is not None}")
            
            if hasattr(final_response, 'text') and final_response.text is not None and final_response.text.strip():
                self._log(f"Returning final_response.text (length: {len(final_response.text)}): {final_response.text[:200]}{'...' if len(final_response.text) > 200 else ''}")
                return final_response.text
            else:
                # Check for text parts in candidates
                text_parts = []
                if hasattr(final_response, 'candidates') and final_response.candidates:
                    self._log(f"Checking {len(final_response.candidates)} candidates for text parts")
                    for candidate in final_response.candidates:
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            for part in candidate.content.parts:
                                if hasattr(part, 'text') and part.text and part.text.strip():
                                    text_parts.append(part.text)
                                    self._log(f"Found text part: {part.text[:100]}{'...' if len(part.text) > 100 else ''}")
                
                if text_parts:
                    result_text = ''.join(text_parts)
                    self._log(f"Returning joined text parts: {result_text[:100]}{'...' if len(result_text) > 100 else ''}")
                    return result_text
                else:
                    self._log("No text content found in final response", "warning")
                    return "Function executed successfully, but no response was generated."
            
        except Exception as e:
            self._log(f"Error sending function results (stateless): {e}", "error")
            raise

    def get_conversation_history(self) -> typing.List[typing.Dict]:
        """Get conversation history if memory is enabled."""
        if not self.memory or not self._chat_session:
            self._log("No conversation history available (memory disabled or no chat session)", "warning")
            return []
        
        try:
            history = []
            for message in self._chat_session.get_history():
                history.append({
                    'role': message.role,
                    'content': message.parts[0].text if message.parts else ''
                })
            return history
        except Exception as e:
            self._log(f"Error getting conversation history: {e}", "error")
            return []

    def clear_memory(self):
        """Clear conversation memory by reinitializing the chat session."""
        if self.memory:
            self._log("Clearing conversation memory")
            self._initialize_chat_session()
        else:
            self._log("Memory is disabled, nothing to clear", "warning")

    def inject_messages(self, messages: typing.List[typing.Dict]):
        """Inject recent messages into memory and reinitialize chat session.
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys.
                     Typically the last N messages from external storage.
        """
        if not self.memory:
            self._log("Memory is disabled, cannot inject messages", "warning")
            return
            
        self._last_n_messages = messages
        self._log(f"Injecting {len(messages)} messages and reinitializing chat session")
        self._initialize_chat_session()
