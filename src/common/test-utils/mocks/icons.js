// Mock factory for @common/icons
// Usage in test file:
// import { createIconsMock } from '@common/test-utils/mocks/icons';
// jest.mock("@common/icons", () => createIconsMock());

export const createIconsMock = (iconOverrides = {}) => ({
  HomeIcon: ({ testID }) => <></>,
  SettingsIcon: () => <></>,
  MusicIcon: () => <></>,
  ReadIcon: () => <></>,
  ArrowRightIcon: () => <></>,
  BackArrowIcon: () => <></>,
  BookmarkIcon: () => <></>,
  ChevronRight: () => <></>,
  CircleIcon: () => <></>,
  CloseIcon: () => <></>,
  DownloadIcon: () => <></>,
  ExpandCollapseIcon: () => <></>,
  minusIcon: () => <></>,
  MusicNoteIcon: () => <></>,
  PauseIcon: () => <></>,
  PlayIcon: () => <></>,
  plusIcon: () => <></>,
  RefreshIcon: () => <></>,
  StopIcon: () => <></>,
  ...iconOverrides,
});
