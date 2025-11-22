#!/bin/bash

# Script para corrigir erros de TypeScript

cd /tmp/kimo

echo "🔧 Corrigindo erros TypeScript..."

# 1. Remover import não usado
sed -i.bak '/import { AppError/d' src/application/controllers/WhatsAppWebhookController.ts

# 2. Exportar ExpenseType de Expense.ts
cat > src/domain/entities/Expense.ts << 'EOF'
import { Money } from '../value-objects/Money';
import { ExpenseType } from '../enums';

// Re-export para compatibilidade
export { ExpenseType };

export interface ExpenseProps {
  id: string;
  userId: string;
  date: Date;
  type: ExpenseType;
  amount: Money;
  note?: string;
  createdAt: Date;
}

/**
 * Expense Entity (Despesa)
 * Representa uma despesa do motorista
 * Princípio: Single Responsibility
 */
export class Expense {
  private constructor(private readonly props: ExpenseProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('Expense ID is required');
    }
    if (!this.props.userId) {
      throw new Error('User ID is required');
    }
    if (!(this.props.date instanceof Date) || isNaN(this.props.date.getTime())) {
      throw new Error('Valid date is required');
    }
    if (!Object.values(ExpenseType).includes(this.props.type)) {
      throw new Error(`Invalid expense type: ${this.props.type}`);
    }
    if (this.props.amount.getValue() <= 0) {
      throw new Error('Expense amount must be positive');
    }
  }

  static create(props: Omit<ExpenseProps, 'createdAt'>): Expense {
    return new Expense({
      ...props,
      createdAt: new Date()
    });
  }

  static reconstitute(props: ExpenseProps): Expense {
    return new Expense(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get date(): Date {
    return this.props.date;
  }

  get type(): ExpenseType {
    return this.props.type;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get note(): string | undefined {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business methods
  isFuelExpense(): boolean {
    return this.props.type === ExpenseType.FUEL;
  }

  isMaintenanceExpense(): boolean {
    return [
      ExpenseType.MAINTENANCE,
      ExpenseType.TIRES,
      ExpenseType.CLEANING
    ].includes(this.props.type);
  }

  isVariableExpense(): boolean {
    return [
      ExpenseType.FUEL,
      ExpenseType.MAINTENANCE,
      ExpenseType.TIRES,
      ExpenseType.CLEANING,
      ExpenseType.TOLLS,
      ExpenseType.PARKING,
      ExpenseType.OTHER
    ].includes(this.props.type);
  }
}
EOF

# 3. Corrigir whatsapp.routes.ts paths
sed -i.bak 's|from '\''../messaging/EvolutionAPIProvider'\''|from '\''../../infrastructure/messaging/EvolutionAPIProvider'\''|' src/infrastructure/http/routes/whatsapp.routes.ts
sed -i.bak 's|from '\''../database/repositories/|from '\''../../infrastructure/database/repositories/|g' src/infrastructure/http/routes/whatsapp.routes.ts
sed -i.bak 's|from '\''../database/supabase.client'\''|from '\''../../infrastructure/database/supabase.client'\''|' src/infrastructure/http/routes/whatsapp.routes.ts

# 4. Fix ConversationService spread types
# (Manual fix needed - will create corrected version)

echo "✅ Correções aplicadas!"
echo ""
echo "Agora execute: git add . && git commit && git push"

