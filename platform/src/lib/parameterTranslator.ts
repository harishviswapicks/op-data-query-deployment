import { AgentConfiguration } from "@/types";

/**
 * Converts user-friendly agent configuration to technical parameters
 * for backend API calls and AI model configuration
 */
export class ParameterTranslator {
  /**
   * Convert creativity level (0-100) to temperature (0.0-2.0)
   * Lower creativity = more predictable, higher creativity = more creative
   */
  static creativityToTemperature(creativityLevel: number): number {
    // Map 0-100 to 0.0-2.0 with a slight curve for better UX
    const normalized = Math.max(0, Math.min(100, creativityLevel)) / 100;
    return Math.round((normalized * 2.0) * 100) / 100;
  }

  /**
   * Convert response length to max_tokens
   */
  static responseLengthToTokens(responseLength: AgentConfiguration['responseLength']): number {
    const tokenMap = {
      brief: 150,        // Short, concise responses
      standard: 400,     // Moderate detail
      comprehensive: 800 // Detailed explanations
    };
    return tokenMap[responseLength];
  }

  /**
   * Convert personality to system prompt modifiers
   */
  static personalityToPromptModifier(personality: AgentConfiguration['personality']): string {
    const modifiers = {
      professional: "Maintain a professional, business-focused tone. Use formal language and structure responses clearly.",
      friendly: "Use a warm, conversational tone. Be approachable and personable while remaining helpful.",
      concise: "Be brief and direct. Provide essential information without unnecessary elaboration.",
      detailed: "Provide comprehensive explanations with context, examples, and thorough analysis."
    };
    return modifiers[personality];
  }

  /**
   * Convert response style to processing parameters
   */
  static responseStyleToProcessingConfig(responseStyle: AgentConfiguration['responseStyle']) {
    const configs = {
      quick: {
        maxProcessingTime: 5000,  // 5 seconds
        analysisDepth: 'surface',
        prioritizeSpeed: true
      },
      balanced: {
        maxProcessingTime: 15000, // 15 seconds
        analysisDepth: 'moderate',
        prioritizeSpeed: false
      },
      thorough: {
        maxProcessingTime: 30000, // 30 seconds
        analysisDepth: 'deep',
        prioritizeSpeed: false
      }
    };
    return configs[responseStyle];
  }

  /**
   * Generate complete system prompt from agent configuration
   */
  static generateSystemPrompt(config: AgentConfiguration, userRole: 'analyst' | 'general_employee'): string {
    const personalityModifier = this.personalityToPromptModifier(config.personality);
    const processingConfig = this.responseStyleToProcessingConfig(config.responseStyle);
    
    const roleContext = userRole === 'analyst' 
      ? "You are an AI data analyst assistant helping with BigQuery analysis, chart creation, and business insights."
      : "You are an AI workplace assistant helping with Notion documents, Slack communications, and general workplace questions.";

    let systemPrompt = `${roleContext}\n\n${personalityModifier}`;

    if (config.responseLength === 'brief') {
      systemPrompt += "\n\nKeep responses concise and to the point.";
    } else if (config.responseLength === 'comprehensive') {
      systemPrompt += "\n\nProvide detailed explanations with context and examples.";
    }

    if (processingConfig.prioritizeSpeed) {
      systemPrompt += "\n\nPrioritize quick, immediate responses over exhaustive analysis.";
    } else if (processingConfig.analysisDepth === 'deep') {
      systemPrompt += "\n\nProvide thorough analysis and comprehensive insights.";
    }

    if (config.customInstructions) {
      systemPrompt += `\n\nAdditional instructions: ${config.customInstructions}`;
    }

    return systemPrompt;
  }

  /**
   * Convert full agent configuration to API parameters
   */
  static configToApiParams(config: AgentConfiguration, userRole: 'analyst' | 'general_employee') {
    return {
      temperature: this.creativityToTemperature(config.creativityLevel),
      max_tokens: this.responseLengthToTokens(config.responseLength),
      system_prompt: this.generateSystemPrompt(config, userRole),
      processing_config: this.responseStyleToProcessingConfig(config.responseStyle),
      personality: config.personality,
      response_style: config.responseStyle
    };
  }

  /**
   * Get user-friendly descriptions for current settings
   */
  static getConfigSummary(config: AgentConfiguration): {
    creativity: string;
    responseLength: string;
    personality: string;
    responseStyle: string;
  } {
    const getCreativityDescription = (level: number) => {
      if (level < 30) return "Conservative";
      if (level < 70) return "Balanced";
      return "Creative";
    };

    const descriptions = {
      creativity: getCreativityDescription(config.creativityLevel),
      responseLength: config.responseLength.charAt(0).toUpperCase() + config.responseLength.slice(1),
      personality: config.personality.charAt(0).toUpperCase() + config.personality.slice(1),
      responseStyle: config.responseStyle.charAt(0).toUpperCase() + config.responseStyle.slice(1)
    };

    return descriptions;
  }

  /**
   * Validate configuration values
   */
  static validateConfig(config: AgentConfiguration): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.creativityLevel < 0 || config.creativityLevel > 100) {
      errors.push("Creativity level must be between 0 and 100");
    }

    if (!['brief', 'standard', 'comprehensive'].includes(config.responseLength)) {
      errors.push("Invalid response length");
    }

    if (!['professional', 'friendly', 'concise', 'detailed'].includes(config.personality)) {
      errors.push("Invalid personality type");
    }

    if (!['quick', 'balanced', 'thorough'].includes(config.responseStyle)) {
      errors.push("Invalid response style");
    }

    if (config.customInstructions && config.customInstructions.length > 500) {
      errors.push("Custom instructions must be less than 500 characters");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default configuration for a user role
   */
  static getDefaultConfig(userRole: 'analyst' | 'general_employee'): AgentConfiguration {
    const baseConfig = {
      creativityLevel: 50,
      responseLength: 'standard' as const,
      customInstructions: undefined
    };

    if (userRole === 'analyst') {
      return {
        ...baseConfig,
        personality: 'professional' as const,
        responseStyle: 'balanced' as const
      };
    } else {
      return {
        ...baseConfig,
        personality: 'friendly' as const,
        responseStyle: 'quick' as const
      };
    }
  }

  /**
   * Create optimized configuration for specific use cases
   */
  static getOptimizedConfig(useCase: 'speed' | 'accuracy' | 'creativity' | 'detail'): Partial<AgentConfiguration> {
    const configs = {
      speed: {
        responseStyle: 'quick' as const,
        responseLength: 'brief' as const,
        creativityLevel: 30
      },
      accuracy: {
        responseStyle: 'thorough' as const,
        personality: 'professional' as const,
        creativityLevel: 20
      },
      creativity: {
        creativityLevel: 80,
        personality: 'friendly' as const,
        responseStyle: 'balanced' as const
      },
      detail: {
        responseLength: 'comprehensive' as const,
        responseStyle: 'thorough' as const,
        personality: 'detailed' as const
      }
    };

    return configs[useCase];
  }
}

/**
 * Helper functions for common parameter conversions
 */
export const parameterHelpers = {
  /**
   * Quick temperature conversion
   */
  getTemperature: (creativityLevel: number) => 
    ParameterTranslator.creativityToTemperature(creativityLevel),

  /**
   * Quick token limit conversion
   */
  getTokenLimit: (responseLength: AgentConfiguration['responseLength']) => 
    ParameterTranslator.responseLengthToTokens(responseLength),

  /**
   * Check if configuration favors speed
   */
  isSpeedOptimized: (config: AgentConfiguration) => 
    config.responseStyle === 'quick' && config.responseLength === 'brief',

  /**
   * Check if configuration favors detail
   */
  isDetailOptimized: (config: AgentConfiguration) => 
    config.responseStyle === 'thorough' && config.responseLength === 'comprehensive',

  /**
   * Get estimated response time based on configuration
   */
  getEstimatedResponseTime: (config: AgentConfiguration) => {
    const baseTime = ParameterTranslator.responseStyleToProcessingConfig(config.responseStyle).maxProcessingTime;
    const lengthMultiplier = {
      brief: 0.7,
      standard: 1.0,
      comprehensive: 1.5
    }[config.responseLength];
    
    return Math.round(baseTime * lengthMultiplier);
  }
};
