/**
 * AI Prompt Utility
 *
 * Provides region-aware AI prompts based on deployment region.
 * Automatically selects Chinese prompts for CN region and English prompts for INTL region.
 */

import { aiPrompts as zhCNPrompts } from './zh-CN';
import { aiPrompts as enUSPrompts } from './en-US';

/**
 * Get the deployment region from environment variable
 * @returns 'CN' for China (domestic) or 'INTL' for international
 */
export function getDeploymentRegion(): 'CN' | 'INTL' {
  const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION;
  return region === 'INTL' ? 'INTL' : 'CN'; // Default to CN if not set
}

/**
 * Get AI prompts based on the current deployment region
 * @returns AI prompts in the appropriate language
 */
export function getAIPrompts() {
  const region = getDeploymentRegion();
  return region === 'INTL' ? enUSPrompts : zhCNPrompts;
}

/**
 * Get prompts for question generation API
 */
export function getQuestionGenerationPrompts() {
  return getAIPrompts().questionGeneration;
}

/**
 * Get prompts for search guidance API
 */
export function getSearchGuidancePrompts() {
  return getAIPrompts().searchGuidance;
}

/**
 * Get prompts for targeted questions API
 */
export function getTargetedQuestionsPrompts() {
  return getAIPrompts().targetedQuestions;
}

/**
 * Get prompts for document-based questions API
 */
export function getDocumentQuestionsPrompts() {
  return getAIPrompts().documentQuestions;
}

/**
 * Get prompts for answer explanation API
 */
export function getExplainAnswerPrompts() {
  return getAIPrompts().explainAnswer;
}

/**
 * Get prompts for document chat API
 */
export function getDocumentChatPrompts() {
  return getAIPrompts().documentChat;
}

/**
 * Get prompts for performance analysis API
 */
export function getAnalyzePerformancePrompts() {
  return getAIPrompts().analyzePerformance;
}

// Export types for TypeScript support
export type DeploymentRegion = 'CN' | 'INTL';
export type AIPrompts = typeof zhCNPrompts;
