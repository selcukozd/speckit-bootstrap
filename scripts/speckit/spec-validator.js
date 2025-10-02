import fs from 'fs/promises';
import path from 'path';

export class SpecValidator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async validateSpec(specPath) {
    const content = await fs.readFile(specPath, 'utf-8');
    const results = {
      valid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: [],
      metrics: {
        clarity: 0,
        completeness: 0,
        testability: 0,
        ambiguity_count: 0
      }
    };

    // Check for required sections
    await this.checkRequiredSections(content, results);

    // Check for ambiguous language
    await this.checkAmbiguity(content, results);

    // Check for implementation details (anti-pattern)
    await this.checkImplementationDetails(content, results);

    // Check testability
    await this.checkTestability(content, results);

    // Calculate scores
    this.calculateScores(results);

    return results;
  }

  async checkRequiredSections(content, results) {
    const requiredSections = [
      { name: 'User Scenarios', pattern: /##\s*User Scenarios/i },
      { name: 'Requirements', pattern: /##\s*Requirements/i },
      { name: 'Functional Requirements', pattern: /###\s*Functional Requirements/i },
      { name: 'Acceptance Scenarios', pattern: /###\s*Acceptance Scenarios/i }
    ];

    for (const section of requiredSections) {
      if (!section.pattern.test(content)) {
        results.errors.push(`Missing required section: ${section.name}`);
        results.valid = false;
        results.score -= 15;
      }
    }
  }

  async checkAmbiguity(content, results) {
    // Check for [NEEDS CLARIFICATION] markers
    const clarificationMatches = content.match(/\[NEEDS CLARIFICATION:([^\]]+)\]/g);
    if (clarificationMatches) {
      results.metrics.ambiguity_count = clarificationMatches.length;
      results.warnings.push(`Found ${clarificationMatches.length} areas needing clarification`);
      results.score -= clarificationMatches.length * 5;

      clarificationMatches.forEach(match => {
        results.warnings.push(`Clarification needed: ${match}`);
      });
    }

    // Check for vague language
    const vaguePatterns = [
      { pattern: /\b(should|could|might|maybe|possibly|probably)\b/gi, severity: 'medium' },
      { pattern: /\b(etc|and so on|and more)\b/gi, severity: 'high' },
      { pattern: /\b(user-friendly|easy to use|simple|intuitive)\b/gi, severity: 'medium' },
      { pattern: /\b(fast|slow|quick|better|good|bad)\b(?!\s+(response|load|than))/gi, severity: 'high' },
      { pattern: /\b(some|many|few|several)\b/gi, severity: 'medium' }
    ];

    for (const { pattern, severity } of vaguePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        const count = matches.length;
        if (severity === 'high') {
          results.warnings.push(`Found ${count} instances of vague language: ${[...new Set(matches)].join(', ')}`);
          results.score -= count * 3;
        } else {
          results.suggestions.push(`Consider being more specific: ${[...new Set(matches)].join(', ')} (${count} instances)`);
          results.score -= count;
        }
      }
    }
  }

  async checkImplementationDetails(content, results) {
    const implementationPatterns = [
      { pattern: /\b(React|Vue|Angular|Next\.js|Express)\b/g, type: 'framework' },
      { pattern: /\b(PostgreSQL|MySQL|MongoDB|Redis)\b/g, type: 'database' },
      { pattern: /\b(API|endpoint|route|controller)\b/gi, type: 'technical' },
      { pattern: /\b(class|function|component|service|module)\b/gi, type: 'code structure' },
      { pattern: /\b(CSS|Tailwind|styled-components|SCSS)\b/g, type: 'styling' },
      { pattern: /\b(npm|yarn|package)\b/gi, type: 'tooling' }
    ];

    for (const { pattern, type } of implementationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        results.warnings.push(`Spec contains implementation details (${type}): ${[...new Set(matches)].join(', ')}`);
        results.score -= matches.length * 2;
      }
    }
  }

  async checkTestability(content, results) {
    // Check for Given-When-Then patterns
    const gwtMatches = content.match(/\*\*Given\*\*.*\*\*When\*\*.*\*\*Then\*\*/gi);
    if (gwtMatches) {
      results.suggestions.push(`Found ${gwtMatches.length} testable acceptance scenarios (good!)`);
      results.metrics.testability += gwtMatches.length * 10;
    } else {
      results.warnings.push('No Given-When-Then acceptance scenarios found');
      results.score -= 10;
    }

    // Check for measurable requirements
    const measurablePatterns = [
      /MUST\s+(?:be|have|allow|support|provide)/gi,
      /SHALL\s+(?:be|have|allow|support|provide)/gi,
      /\d+\s*(?:ms|seconds|minutes|MB|KB|requests|users)/gi
    ];

    let measurableCount = 0;
    for (const pattern of measurablePatterns) {
      const matches = content.match(pattern);
      if (matches) measurableCount += matches.length;
    }

    if (measurableCount < 3) {
      results.warnings.push('Few measurable requirements found. Use "MUST", "SHALL", or specific metrics.');
      results.score -= 5;
    } else {
      results.suggestions.push(`Found ${measurableCount} measurable requirements (good!)`);
    }

    results.metrics.testability = Math.min(100, measurableCount * 10);
  }

  calculateScores(results) {
    // Clarity score (inverse of ambiguity)
    results.metrics.clarity = Math.max(0, 100 - (results.metrics.ambiguity_count * 10));

    // Completeness score
    const errorPenalty = results.errors.length * 20;
    const warningPenalty = results.warnings.length * 5;
    results.metrics.completeness = Math.max(0, 100 - errorPenalty - warningPenalty);

    // Overall score
    results.score = Math.max(0, Math.min(100, results.score));

    // Set validity
    results.valid = results.errors.length === 0 && results.score >= 60;
  }

  async generateReport(results, outputPath = null) {
    const report = `# Spec Validation Report

## Overall Score: ${results.score}/100 ${this.getGrade(results.score)}

**Status:** ${results.valid ? '✅ Valid' : '❌ Invalid'}

## Metrics
- **Clarity:** ${results.metrics.clarity}/100 ${this.getBar(results.metrics.clarity)}
- **Completeness:** ${results.metrics.completeness}/100 ${this.getBar(results.metrics.completeness)}
- **Testability:** ${results.metrics.testability}/100 ${this.getBar(results.metrics.testability)}
- **Ambiguities Found:** ${results.metrics.ambiguity_count}

## Issues

### ❌ Errors (${results.errors.length})
${results.errors.length > 0 ? results.errors.map(e => `- ${e}`).join('\n') : '- None'}

### ⚠️ Warnings (${results.warnings.length})
${results.warnings.length > 0 ? results.warnings.map(w => `- ${w}`).join('\n') : '- None'}

### 💡 Suggestions (${results.suggestions.length})
${results.suggestions.length > 0 ? results.suggestions.map(s => `- ${s}`).join('\n') : '- None'}

## Recommendations

${this.generateRecommendations(results)}

---
*Generated: ${new Date().toLocaleString()}*
`;

    if (outputPath) {
      await fs.writeFile(outputPath, report);
    }

    return report;
  }

  getGrade(score) {
    if (score >= 90) return '🏆 Excellent';
    if (score >= 80) return '✅ Good';
    if (score >= 70) return '🟡 Acceptable';
    if (score >= 60) return '🟠 Needs Improvement';
    return '❌ Poor';
  }

  getBar(score) {
    const filled = Math.floor(score / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (results.metrics.clarity < 70) {
      recommendations.push('- **Improve Clarity:** Address ambiguous language and add specific details to unclear requirements.');
    }

    if (results.metrics.completeness < 70) {
      recommendations.push('- **Improve Completeness:** Add missing required sections and resolve all errors.');
    }

    if (results.metrics.testability < 70) {
      recommendations.push('- **Improve Testability:** Add Given-When-Then scenarios and use measurable requirements (MUST, SHALL, specific metrics).');
    }

    if (results.metrics.ambiguity_count > 0) {
      recommendations.push(`- **Resolve Ambiguities:** Address all ${results.metrics.ambiguity_count} [NEEDS CLARIFICATION] markers.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('- ✅ Spec meets quality standards. Ready for planning phase.');
    }

    return recommendations.join('\n');
  }
}

export default SpecValidator;
