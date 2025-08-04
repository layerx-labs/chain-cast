/**
 * Generic Stack implementation for managing a LIFO (Last In, First Out) data structure.
 *
 * This class provides a type-safe stack implementation that can hold elements of any type.
 * It supports standard stack operations like push, pop, peek, and provides utility methods
 * for checking the stack state and accessing all elements.
 *
 * @template T - The type of elements stored in the stack
 */
export class Stack<T> {
  /** Internal array that stores the stack elements */
  private stack: T[];

  /**
   * Creates a new empty Stack instance.
   */
  constructor() {
    this.stack = [];
  }

  /**
   * Adds an element to the top of the stack.
   *
   * @param item - The element to add to the stack
   */
  push(item: T) {
    this.stack.push(item);
  }

  /**
   * Removes and returns the top element from the stack.
   *
   * @returns The top element of the stack, or undefined if the stack is empty
   */
  pop(): T | undefined {
    return this.stack.pop();
  }

  /**
   * Checks if the stack is empty.
   *
   * @returns True if the stack has no elements, false otherwise
   */
  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  /**
   * Gets the number of elements currently in the stack.
   *
   * @returns The number of elements in the stack
   */
  size(): number {
    return this.stack.length;
  }

  /**
   * Returns the top element of the stack without removing it.
   *
   * This method allows you to examine the top element without modifying the stack.
   *
   * @returns The top element of the stack, or undefined if the stack is empty
   */
  peek(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  /**
   * Removes all elements from the stack, making it empty.
   */
  clear() {
    this.stack = [];
  }

  /**
   * Returns all elements in the stack as an array.
   *
   * This method provides access to all stack elements without modifying the stack.
   * The returned array represents the stack from bottom to top.
   *
   * @returns Array containing all elements in the stack
   */
  getAll() {
    return this.stack;
  }
}
