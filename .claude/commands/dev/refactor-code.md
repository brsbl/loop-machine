# Project Overview: Loop Machine

**Loop Machine** is a web-based drum machine and sequencer. It allows users to create, play, and manipulate drum patterns using web audio, with a focus on usability and state persistence.

## Main Features
- **Step Sequencer:** 16-step grid for programming drum patterns (kick, snare, hi-hat by default).
- **Audio Engine:** Uses the Web Audio API to load and play drum samples.
- **Effects:** Per-instrument reverb and delay, with real-time control.
- **State Persistence:** Patterns and effect settings can be encoded/decoded for URL or JSON-based state sharing.
- **UI:** Modern, responsive interface with a sidebar for JSON state editing and controls for play/stop, reset, and effect sliders.

## Key Files & Structure
- **index.html:** Main entry point, sets up the UI structure and loads scripts/styles.
- **script.js:** Main application logic (audio, sequencer, state, UI, event handling).
- **style.css:** Modern, responsive layout and visual feedback for sequencer and controls.
- **script.test.js:** Jest-based test suite for core logic (state, timing, audio loading).
- **Sample Libraries:** Large collections of drum samples (808, 909, etc.) in organized folders.

## Development & Quality
- **Testing:** Good coverage of core logic, logic-focused tests, documented setup.
- **Linting/Formatting:** ESLint, Prettier, Husky, and lint-staged for code quality.
- **Extensibility:** Modular code, easy to add instruments/effects, clear separation of concerns.

## Summary
- Mature, well-structured web drum machine.
- Modern UI, robust audio engine, and good test coverage for core logic.
- Ready for further feature development, UI enhancements, or expansion of sample libraries.

# Intelligently Refactor and Improve Code Quality

Intelligently refactor and improve code quality

## Instructions

Follow this systematic approach to refactor code: **$ARGUMENTS**

1. **Pre-Refactoring Analysis**
   - Identify the code that needs refactoring and the reasons why
   - Understand the current functionality and behavior completely
   - Review existing tests and documentation
   - Identify all dependencies and usage points

2. **Test Coverage Verification**
   - Ensure comprehensive test coverage exists for the code being refactored
   - If tests are missing, write them BEFORE starting refactoring
   - Run all tests to establish a baseline
   - Document current behavior with additional tests if needed

3. **Refactoring Strategy**
   - Define clear goals for the refactoring (performance, readability, maintainability)
   - Choose appropriate refactoring techniques:
     - Extract Method/Function
     - Extract Class/Component
     - Rename Variable/Method
     - Move Method/Field
     - Replace Conditional with Polymorphism
     - Eliminate Dead Code
   - Plan the refactoring in small, incremental steps

4. **Environment Setup**
   - Create a new branch: `git checkout -b refactor/$ARGUMENTS`
   - Ensure all tests pass before starting
   - Set up any additional tooling needed (profilers, analyzers)

5. **Incremental Refactoring**
   - Make small, focused changes one at a time
   - Run tests after each change to ensure nothing breaks
   - Commit working changes frequently with descriptive messages
   - Use IDE refactoring tools when available for safety

6. **Code Quality Improvements**
   - Improve naming conventions for clarity
   - Eliminate code duplication (DRY principle)
   - Simplify complex conditional logic
   - Reduce method/function length and complexity
   - Improve separation of concerns

7. **Performance Optimizations**
   - Identify and eliminate performance bottlenecks
   - Optimize algorithms and data structures
   - Reduce unnecessary computations
   - Improve memory usage patterns

8. **Design Pattern Application**
   - Apply appropriate design patterns where beneficial
   - Improve abstraction and encapsulation
   - Ensure SOLID principles are followed
   - Consider dependency injection where appropriate

9. **Error Handling Enhancement**
   - Improve error messages and logging
   - Add proper exception handling
   - Implement circuit breakers for external dependencies
   - Add retry logic with exponential backoff where appropriate

10. **Documentation Updates**
    - Update code comments to reflect changes
    - Revise API documentation
    - Update architectural diagrams if needed
    - Document any breaking changes

11. **Final Verification**
    - Run full test suite
    - Perform code coverage analysis
    - Run static analysis tools
    - Review performance metrics
    - Conduct peer code review

12. **Commit and Document**
    - Create clear, descriptive commit messages
    - Document the refactoring rationale in PR description
    - Include before/after comparisons if helpful
    - Note any potential risks or considerations

## Refactoring Principles
- **Make it work, make it right, make it fast** - in that order
- **Leave the code better than you found it**
- **Refactor in small steps with continuous testing**
- **Don't mix refactoring with feature changes**
- **Keep behavior unchanged during pure refactoring**

## Common Code Smells to Address
- Long methods/functions
- Large classes
- Duplicate code
- Complex conditional expressions
- Primitive obsession
- Feature envy
- Data clumps
- Switch statements
- Parallel inheritance hierarchies
- Lazy classes
- Speculative generality
- Temporary fields
- Message chains
- Middle man
- Inappropriate intimacy
- Alternative classes with different interfaces
- Incomplete library classes
- Data classes
- Refused bequest
- Comments explaining complex code

Remember: The goal is to improve code quality while maintaining existing functionality. Always prioritize clarity and maintainability over cleverness.