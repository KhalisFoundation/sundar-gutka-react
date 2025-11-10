// Mock factory for react-redux
// Usage in test file:
// import { createReactReduxMock, getMockDispatch, getMockState, setMockState } from '@common/test-utils/mocks/react-redux';
// const reactReduxMock = createReactReduxMock();
// jest.mock("react-redux", () => reactReduxMock.mock);
// Then use getMockDispatch(), getMockState(), setMockState() in your tests

let mockDispatch = jest.fn();
let mockState = { isAudio: false, currentBani: { id: 123 } };

export const createReactReduxMock = (initialState = {}) => {
  mockDispatch = jest.fn();
  mockState = { isAudio: false, currentBani: { id: 123 }, ...initialState };

  return {
    mockDispatch,
    mockState,
    setMockState: (newState) => {
      mockState = { ...mockState, ...newState };
    },
    mock: {
      useDispatch: () => mockDispatch,
      useSelector: (selector) => selector(mockState),
      Provider: ({ children }) => children,
      connect: (_mapStateToProps, _mapDispatchToProps) => (Component) => Component,
    },
  };
};

// Get current mock state/dispatch (for tests that need to access them)
export const getMockDispatch = () => mockDispatch;
export const getMockState = () => mockState;
export const setMockState = (newState) => {
  mockState = { ...mockState, ...newState };
};
