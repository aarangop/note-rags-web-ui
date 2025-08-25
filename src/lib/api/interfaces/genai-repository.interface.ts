// Placeholder for GenAI repository interface
// To be implemented when GenAI API types are available

import { IBaseRepository } from "./base-repository.interface";

export interface IGenAIRepository extends IBaseRepository {
  // Placeholder methods - to be defined based on GenAI API spec
  generateSummary?(content: string): Promise<string>;
  generateTags?(content: string): Promise<string[]>;
  answerQuestion?(content: string, question: string): Promise<string>;
}

// Note: Implementation will be added when GenAI OpenAPI types are generated
