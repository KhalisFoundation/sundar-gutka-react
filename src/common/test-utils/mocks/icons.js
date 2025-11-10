// Mock factory for @common/icons
// Usage in test file:
// import { createIconsMock } from '@common/test-utils/mocks/icons';
// jest.mock("@common/icons", () => createIconsMock());

export const createIconsMock = (iconOverrides = {}) => ({
  HomeIcon: () => null,
  SettingsIcon: () => null,
  MusicIcon: () => null,
  ReadIcon: () => null,
  ArrowRightIcon: () => null,
  BackArrowIcon: () => null,
  BookmarkIcon: () => null,
  ChevronRight: () => null,
  CircleIcon: () => null,
  CloseIcon: () => null,
  DownloadIcon: () => null,
  ExpandCollapseIcon: () => null,
  minusIcon: () => null,
  MusicNoteIcon: () => null,
  PauseIcon: () => null,
  PlayIcon: () => null,
  plusIcon: () => null,
  RefreshIcon: () => null,
  StopIcon: () => null,
  ...iconOverrides,
});
