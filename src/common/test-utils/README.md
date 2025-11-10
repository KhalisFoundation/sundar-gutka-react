# Test Utilities

This directory contains reusable mocks and test utilities for testing React Native components.

## Usage

### Basic Usage

Import the mock factories and use them in your `jest.mock()` calls:

```javascript
import { getMockDispatch, getMockState, setMockState } from "@common/test-utils/mocks/react-redux";
import { createContextMock } from "@common/test-utils/mocks/context";
import { createUseThemedStylesMock } from "@common/test-utils/mocks/useThemedStyles";
import { createIconsMock } from "@common/test-utils/mocks/icons";
import { createCommonMock } from "@common/test-utils/mocks/common";

// Mock react-redux hooks
jest.mock("react-redux", () => {
  const { createReactReduxMock } = require("@common/test-utils/mocks/react-redux");
  return createReactReduxMock().mock;
});

// Mock theme/context
jest.mock("@common/context", () => {
  const { createContextMock } = require("@common/test-utils/mocks/context");
  return createContextMock();
});

// Mock useThemedStyles
jest.mock("@common/hooks/useThemedStyles", () => {
  const { createUseThemedStylesMock } = require("@common/test-utils/mocks/useThemedStyles");
  return createUseThemedStylesMock();
});

// Mock icons
jest.mock("@common/icons", () => {
  const { createIconsMock } = require("@common/test-utils/mocks/icons");
  return createIconsMock();
});

// Mock @common exports
jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock();
});

// In your tests, use the utilities to access mock state/dispatch
const mockDispatch = getMockDispatch();

beforeEach(() => {
  setMockState({ isAudio: false, currentBani: { id: 123 } });
});
```

### Available Mocks

#### `react-redux` Mock

- **Factory**: `createReactReduxMock(initialState?)`
- **Utilities**: `getMockDispatch()`, `getMockState()`, `setMockState(newState)`

```javascript
import {
  createReactReduxMock,
  getMockDispatch,
  setMockState,
} from "@common/test-utils/mocks/react-redux";

jest.mock("react-redux", () => {
  const { createReactReduxMock } = require("@common/test-utils/mocks/react-redux");
  return createReactReduxMock({ isAudio: true }).mock;
});

// In tests
const mockDispatch = getMockDispatch();
setMockState({ isAudio: false, currentBani: { id: 456 } });
```

#### `@common/context` Mock

- **Factory**: `createContextMock(themeOverrides?)`

```javascript
import { createContextMock } from "@common/test-utils/mocks/context";

jest.mock("@common/context", () => {
  const { createContextMock } = require("@common/test-utils/mocks/context");
  return createContextMock({
    colors: { primary: "#FF0000" },
    staticColors: { WHITE_COLOR: "#FFFFFF" },
  });
});
```

#### `useThemedStyles` Mock

- **Factory**: `createUseThemedStylesMock(stylesOverrides?)`

```javascript
import { createUseThemedStylesMock } from "@common/test-utils/mocks/useThemedStyles";

jest.mock("@common/hooks/useThemedStyles", () => {
  const { createUseThemedStylesMock } = require("@common/test-utils/mocks/useThemedStyles");
  return createUseThemedStylesMock({
    container: { backgroundColor: "red" },
  });
});
```

#### `@common/icons` Mock

- **Factory**: `createIconsMock(iconOverrides?)`

```javascript
import { createIconsMock } from "@common/test-utils/mocks/icons";

jest.mock("@common/icons", () => {
  const { createIconsMock } = require("@common/test-utils/mocks/icons");
  return createIconsMock({
    CustomIcon: () => <CustomComponent />,
  });
});
```

#### `@common` Mock

- **Factory**: `createCommonMock(overrides?)`

```javascript
import { createCommonMock } from "@common/test-utils/mocks/common";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      HOME: "Custom Home",
      READ: "Custom Read",
    },
  });
});
```

## File Structure

```
test-utils/
├── mocks/
│   ├── react-redux.js    # React Redux hooks mock
│   ├── context.js         # Theme context mock
│   ├── useThemedStyles.js # useThemedStyles hook mock
│   ├── icons.js          # Icons mock
│   ├── common.js         # @common exports mock
│   └── index.js          # Centralized exports
└── README.md             # This file
```

## Notes

- All `jest.mock()` calls are hoisted, so factory functions must be called inside the mock factory function using `require()`
- Use `getMockDispatch()`, `getMockState()`, and `setMockState()` to access and modify mock state in your tests
- Mock factories accept optional overrides to customize the mock behavior
