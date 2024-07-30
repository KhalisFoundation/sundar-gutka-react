import { constant } from "../../common";

function onPress(bani, navigate) {
  if (!bani.folder) {
    navigate(constant.READER, {
      key: `Reader-${bani.id}`,
      params: { id: bani.id, title: bani.gurmukhi },
    });
  } else {
    navigate(constant.FOLDERSCREEN, {
      key: `Folder-${bani.gurmukhi}`,
      params: { data: bani.folder, title: bani.gurmukhi },
    });
  }
}
export default onPress;
