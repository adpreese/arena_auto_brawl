// Element Registry for managing elemental relationships and calculations
import { Element, ElementMeta } from './types';
import elementsData from './elements.json';

export class ElementRegistry {
  private static instance: ElementRegistry;
  private elements: Map<Element, ElementMeta> = new Map();

  constructor() {
    this.loadElements();
  }

  static getInstance(): ElementRegistry {
    if (!ElementRegistry.instance) {
      ElementRegistry.instance = new ElementRegistry();
    }
    return ElementRegistry.instance;
  }

  private loadElements(): void {
    for (const [key, data] of Object.entries(elementsData)) {
      const element = key as Element;
      this.elements.set(element, data as ElementMeta);
    }
  }

  getElement(element: Element): ElementMeta | undefined {
    return this.elements.get(element);
  }

  getAllElements(): Element[] {
    return Array.from(this.elements.keys());
  }

  getElementColor(element: Element): string {
    const meta = this.elements.get(element);
    return meta?.color || '#FFFFFF';
  }

  getElementIcon(element: Element): string {
    const meta = this.elements.get(element);
    return meta?.icon || '?';
  }

  /**
   * Calculate elemental damage modifier based on attack element, attacker element, and defender element
   * @param attackElement - The element of the attack
   * @param attackerElement - The element of the attacker (for STAB)
   * @param defenderElement - The element of the defender (for effectiveness)
   * @returns Damage multiplier
   */
  calculateElementalModifier(attackElement: Element, attackerElement: Element, defenderElement: Element): number {
    let modifier = 1.0;

    // Same-Type Attack Bonus (STAB)
    if (attackerElement === attackElement) {
      modifier *= 1.25;
    }

    // Elemental effectiveness
    const defenderMeta = this.elements.get(defenderElement);
    if (defenderMeta) {
      if (defenderMeta.weakAgainst.includes(attackElement)) {
        modifier *= 1.25; // Super effective
      } else if (defenderMeta.strongAgainst.includes(attackElement)) {
        modifier *= 0.75; // Not very effective
      }
    }

    return modifier;
  }

  /**
   * Get a random element
   */
  getRandomElement(): Element {
    const elements = this.getAllElements();
    return elements[Math.floor(Math.random() * elements.length)];
  }

  /**
   * Check if an element is strong against another
   */
  isStrongAgainst(attacker: Element, defender: Element): boolean {
    const attackerMeta = this.elements.get(attacker);
    return attackerMeta?.strongAgainst.includes(defender) || false;
  }

  /**
   * Check if an element is weak against another
   */
  isWeakAgainst(attacker: Element, defender: Element): boolean {
    const attackerMeta = this.elements.get(attacker);
    return attackerMeta?.weakAgainst.includes(defender) || false;
  }

  /**
   * Check if an attack is super effective (attacker has advantage over defender)
   */
  isSuperEffective(attackElement: Element, defenderElement: Element): boolean {
    const defenderMeta = this.elements.get(defenderElement);
    return defenderMeta?.weakAgainst.includes(attackElement) || false;
  }

  /**
   * Check if an attack is not very effective (defender resists attacker)
   */
  isNotVeryEffective(attackElement: Element, defenderElement: Element): boolean {
    const defenderMeta = this.elements.get(defenderElement);
    return defenderMeta?.strongAgainst.includes(attackElement) || false;
  }
}

// Export singleton instance
export const elementRegistry = ElementRegistry.getInstance();