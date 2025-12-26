# Contributing to Sundar Gutka

First of all, thank you for taking the time to contribute!

The following is a set of guidelines for contributing to Sundar Gutka, which is hosted in the Khalis Foundation organization on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Recommendation

Always write code using functional components (hooks based) following latest React and React-native standards.

## Styleguides

### Git Workflow

We are currently following conventional commit style:

1. **Branch Naming**: Use descriptive branch names (`feature/`, `fix/`, `refactor/`)
2. **Small PRs**: Keep pull requests focused and small
3. **Commit Messages**: Follow conventional commit format
4. **Review**: All PRs require review before merging

### JavaScript Styleguide

All JavaScript must adhere to our ESLint and Prettier rules. We recommend using VSCode with Prettier plugin installed to avoid linting errors. We anyway lint the code before pushing to repo.

## Testing

### Writing Tests

**All new features and bug fixes must include tests.** Tests are required for:

---

- New components
- New hooks
- New utility functions
- Bug fixes (regression tests)

### Test Structure

- Place test files next to the component/function they test: `ComponentName.test.jsx` or `hookName.test.js`
- Use Jest and React Testing Library for component testing
- Use the test utilities from `@common/test-utils` for mocking

### Running Tests

```bash
# Run all tests
yarn test
```

### Test Utilities

See [`src/common/test-utils/README.md`](src/common/test-utils/README.md) for available mocks and utilities.

## React Native Best Practices

### Component Structure

1. **Use Functional Components**: Always use functional components with hooks
2. **Memoization**: Use `React.memo()` for components that receive stable props
3. **Custom Hooks**: Extract reusable logic into custom hooks
4. **Component Organization**: Keep components small and focused on a single responsibility

### State Management

1. **Redux**: Use Redux Toolkit for global state management
2. **Local State**: Use `useState` for component-specific state
3. **Context**: Use React Context sparingly, prefer Redux for shared state

### Navigation

1. **Type Safety**: Use TypeScript types for navigation params when possible
2. **Deep Linking**: Consider deep linking when adding new screens
3. **Back Handler**: Use `useBackHandler` hook for Android back button handling

### Styling

1. **Themed Styles**: Always use `useThemedStyles` hook for styling
2. **StyleSheet**: Use `StyleSheet.create()` for performance
3. **Responsive Design**: Consider different screen sizes and orientations

### Error Handling

1. **Error Boundaries**: Wrap components in error boundaries where appropriate
2. **Try-Catch**: Use try-catch for async operations
3. **User Feedback**: Show user-friendly error messages

### Accessibility

1. **Accessibility Labels**: Add `accessibilityLabel` props to interactive elements
2. **Test IDs**: Use `testID` for testing purposes
3. **Screen Reader**: Test with screen readers (VoiceOver/TalkBack)

### Code Organization

1. **File Naming**: Use PascalCase for components, camelCase for utilities
2. **Import Order**: Follow ESLint import order rules
3. **Barrel Exports**: Use index.js files for clean imports
4. **Path Aliases**: Use `@common`, `@database`, `@service`, etc. for imports

### Dependencies

1. **Keep Updated**: Regularly update dependencies
2. **Native Modules**: Test native module changes on both platforms
3. **Lock File**: Commit `yarn.lock` to version control
