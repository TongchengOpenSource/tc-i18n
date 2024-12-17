import inquire from 'inquirer';
import type { QuestionCollection } from 'inquirer';

class BaseInquirer {
  async askQuestion<T extends inquire.Answers>(question: QuestionCollection<T>) {
    return inquire.prompt<T>(question);
  }

  async confirm(message: string, name?: string) {
    return await this.askQuestion({
      type: 'confirm',
      message,
      name: name || 'confirm',
    });
  }

  async list(message: string, choices: string[], name?: string) {
    return await this.askQuestion({
      type: 'list',
      message,
      choices,
      name: name || 'list',
    });
  }
}

export default BaseInquirer;