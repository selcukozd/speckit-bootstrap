import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

export class ConstitutionalEngine {
  constructor(rulesPath = '.speckit/constitutional-rules.yaml', projectRoot = process.cwd()) {
    this.rulesPath = path.isAbsolute(rulesPath) ? rulesPath : path.join(projectRoot, rulesPath);
    this.overridesPath = path.join(projectRoot, '.speckit/state/overrides.json');
    this.rules = null;
    this.overrides = null;
  }

  async load() {
    if (this.rules) return this.rules;
    try {
      const raw = await fs.readFile(this.rulesPath, 'utf-8');
      this.rules = YAML.parse(raw);
    } catch {
      this.rules = {};
    }
    return this.rules;
  }

  async loadOverrides() {
    if (this.overrides) return this.overrides;
    try {
      const raw = await fs.readFile(this.overridesPath, 'utf-8');
      this.overrides = JSON.parse(raw);
    } catch {
      this.overrides = { active: [], history: [] };
    }
    return this.overrides;
  }

  async saveOverride(ruleId, reason, taskId) {
    await this.loadOverrides();
    const override = {
      ruleId,
      reason,
      taskId,
      timestamp: new Date().toISOString(),
      active: true
    };
    this.overrides.active.push(override);
    this.overrides.history.push(override);
    await fs.mkdir(path.dirname(this.overridesPath), { recursive: true });
    await fs.writeFile(this.overridesPath, JSON.stringify(this.overrides, null, 2));
    return override;
  }

  async clearOverrides(taskId) {
    await this.loadOverrides();
    this.overrides.active = this.overrides.active.filter(o => o.taskId !== taskId);
    await fs.writeFile(this.overridesPath, JSON.stringify(this.overrides, null, 2));
  }

  async enforce(action, agent, subtask, taskId = null) {
    await this.load();
    await this.loadOverrides();

    const deny = (reason, ruleId = null) => ({ allowed: false, reason, ruleId });
    const allow = () => ({ allowed: true });

    // Check for active overrides
    const isOverridden = (ruleId) => {
      return this.overrides.active.some(o =>
        o.ruleId === ruleId && (!taskId || o.taskId === taskId)
      );
    };

    const description = (subtask?.description || '').toLowerCase();
    const files = subtask?.files || [];

    // Parse YAML-based rules
    const agentRules = this.rules?.agents?.[agent];
    if (!agentRules) return allow();

    // Check cannot rules from YAML
    const cannotRules = agentRules.cannot || [];
    for (const rule of cannotRules) {
      const ruleText = rule.toLowerCase();

      // Database schema rules
      if (ruleText.includes('database schema') || ruleText.includes('schema change')) {
        const ruleId = `${agent}.cannot.change_schema`;
        if (isOverridden(ruleId)) continue;

        if (/schema|prisma|migration|alter\s+table/.test(description) ||
            files.some(f => /schema|migration/i.test(f))) {
          return deny(`${agent} cannot change database schemas (constitutional rule)`, ruleId);
        }
      }

      // Auth/Authorization rules
      if (ruleText.includes('authentication') || ruleText.includes('authorization')) {
        const ruleId = `${agent}.cannot.modify_auth`;
        if (isOverridden(ruleId)) continue;

        if (/auth|authentication|authorization|jwt|session/.test(description) ||
            files.some(f => /auth|session|jwt/i.test(f))) {
          return deny(`${agent} cannot modify authentication/authorization logic (constitutional rule)`, ruleId);
        }
      }

      // Dependency rules
      if (ruleText.includes('dependencies') || ruleText.includes('add new dependencies')) {
        const ruleId = `${agent}.cannot.add_dependency`;
        if (isOverridden(ruleId)) continue;

        if (/package\.json|pnpm-lock|yarn\.lock/.test(files.join(',')) ||
            /dependency|add package/.test(description)) {
          return deny(`${agent} cannot add dependencies without approval (constitutional rule)`, ruleId);
        }
      }

      // API contract rules
      if (ruleText.includes('api contract') || ruleText.includes('change api')) {
        const ruleId = `${agent}.cannot.change_api`;
        if (isOverridden(ruleId)) continue;

        if (/api\s+contract|breaking change/.test(description)) {
          return deny(`${agent} cannot change API contracts without approval (constitutional rule)`, ruleId);
        }
      }

      // Architectural decisions
      if (ruleText.includes('architectural decision')) {
        const ruleId = `${agent}.cannot.architecture`;
        if (isOverridden(ruleId)) continue;

        if (/architecture|design pattern|refactor structure/.test(description)) {
          return deny(`${agent} cannot make architectural decisions (constitutional rule)`, ruleId);
        }
      }

      // Production deployment
      if (ruleText.includes('production') || ruleText.includes('deploy')) {
        const ruleId = `${agent}.cannot.deploy`;
        if (isOverridden(ruleId)) continue;

        if (/deploy|production|release/.test(description)) {
          return deny(`${agent} cannot deploy to production (constitutional rule)`, ruleId);
        }
      }
    }

    // Check file content for security patterns (if files provided)
    if (files.length > 0) {
      const ruleId = `${agent}.content.security`;
      if (!isOverridden(ruleId)) {
        for (const file of files) {
          try {
            const content = await fs.readFile(file, 'utf-8');

            // SQL injection patterns
            if (/db\.query\(.*\+|\.execute\(.*\+|sql\s*=\s*["'].*\+/.test(content)) {
              return deny('Potential SQL injection detected in file content', ruleId);
            }

            // Hardcoded secrets
            if (/api[_-]?key\s*=\s*["'][^"']+["']|password\s*=\s*["'][^"']+["']|secret\s*=\s*["'][^"']+["']/i.test(content)) {
              return deny('Potential hardcoded secret detected in file content', ruleId);
            }
          } catch {
            // File doesn't exist yet, skip content check
          }
        }
      }
    }

    return allow();
  }

  async checkApprovals(changeType, taskContext) {
    await this.load();
    const requirements = this.rules?.approval_requirements?.[changeType];
    if (!requirements) return { required: [], approved: [], missing: [] };

    const requiredAgents = requirements.requires || [];
    const approvedAgents = taskContext?.approvals || [];
    const missingAgents = requiredAgents.filter(a => !approvedAgents.includes(a));

    return {
      required: requiredAgents,
      approved: approvedAgents,
      missing: missingAgents,
      reason: requirements.reason || 'No reason specified'
    };
  }

  async getAgentCapabilities(agent) {
    await this.load();
    return this.rules?.agents?.[agent] || { role: 'Unknown', can: [], cannot: [], limits: [] };
  }

  async getVetoProtocol(vetoType) {
    await this.load();
    return this.rules?.veto_protocol?.[vetoType] || null;
  }
}

export default ConstitutionalEngine;

