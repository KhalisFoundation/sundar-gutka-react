import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, SectionList, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@rneui/themed';
import { exists, unlink } from 'react-native-fs';
import { removeDownloadEntries, removeDownloadQueueEntry, retryDownload } from '@common/actions';
import constant from '@common/constant';
import useTokens from '@common/hooks/useTokens';
import useTokenStyles from '@common/hooks/useTokenStyles';
import {
  SafeArea,
  StatusBarComponent,
  GradientDivider,
  useBackHandler,
  STRINGS,
  CustomText,
  showConfirm,
  convertToUnicode,
} from '@common';
import { ScreenHeader, Spinner, Text } from '../common/components/ui';
import {
  AUDIO_DIRECTORY_PATH,
  getLocalTrackPath,
} from '../ReaderScreen/components/AudioPlayer/utils/audioDownloader';
import createStyles from './styles';

const formatMB = (mb) => {
  if (!mb || mb <= 0) return '?';
  return mb >= 100 ? String(Math.round(mb)) : mb.toFixed(1);
};

const ManageDownloads = ({ navigation }) => {
  const { c, layout } = useTokens();
  const styles     = useTokenStyles(createStyles);
  const dispatch   = useDispatch();

  const downloadRegistry = useSelector((s) => s.downloadRegistry);
  const downloadQueue    = useSelector((s) => s.downloadQueue);
  const audioCatalog = useSelector((s) => s.audioCatalog);

  // Reciter names come from the live catalog, keyed the way the registry is
  // (the on-disk path), so a reciter renamed on the backend reads correctly
  // here as soon as the catalog has it. The name stored at download time is
  // the fallback for a track the catalog no longer lists.
  const liveArtistName = useMemo(() => {
    const byPath = {};
    Object.values(audioCatalog || {}).forEach((entry) => {
      Object.values(entry?.groups || {}).forEach((group) => {
        (group?.artists || []).forEach((artist) => {
          if (artist?.link && artist.name) byPath[getLocalTrackPath(artist.link)] = artist.name;
        });
      });
    });
    return byPath;
  }, [audioCatalog]);

  // Settings that drive the bani name shown on the home list — read the same
  // ones here so download names stay in sync with it (transliteration on/off,
  // and the Gurmukhi font when it's off).
  const fontFace         = useSelector((s) => s.fontFace);
  const isTransliteration = useSelector((s) => s.isTransliteration);
  const baniList         = useSelector((s) => s.baniList);
  const isUnicode        = fontFace === constant.BALOO_PAAJI;

  // Look up a downloaded track's bani by id so we can render its name live from
  // the same source the home list uses (baniList already carries `translit`
  // computed for the current transliteration language).
  const baniById = useMemo(() => {
    const map = {};
    (baniList || []).forEach((b) => {
      if (b && b.id != null) map[b.id] = b;
    });
    return map;
  }, [baniList]);

  // Mirror BaniList's getBaniTuk so names match the home list exactly. Falls
  // back to the name snapshot stored at download time when the bani can't be
  // resolved (e.g. baniId missing on an older entry, or removed from the DB).
  const getDisplayName = useCallback((item) => {
    const bani = item && item.baniId != null ? baniById[item.baniId] : null;
    const fallback = item.baniNameUni || item.baniTitle;
    if (!bani) return fallback;
    if (isTransliteration) return bani.translit || fallback;
    if (isUnicode) return bani.gurmukhiUni || convertToUnicode(bani.gurmukhi);
    return bani.gurmukhi || fallback;
  }, [baniById, isTransliteration, isUnicode]);

  // Font override for the name: legacy/Unicode Gurmukhi uses the selected
  // fontFace; transliteration uses the default (Latin/Devanagari) font. Matches
  // BaniList's `displayFont = !isTransliteration ? fontFace : null`.
  const nameFontStyle = useMemo(
    () => ({ fontFamily: isTransliteration ? null : fontFace }),
    [isTransliteration, fontFace],
  );

  const [selected, setSelected]   = useState(new Set());
  const [validated, setValidated] = useState(false);

  // Tell the native stack to hide its own header — we render AppBar ourselves.
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  useBackHandler(handleBack);

  // On mount: silently remove stale registry entries (file deleted externally).
  useEffect(() => {
    const validate = async () => {
      const stale = [];
      for (const key of Object.keys(downloadRegistry)) {
        const fullPath = `${AUDIO_DIRECTORY_PATH}/${key}`;
        // eslint-disable-next-line no-await-in-loop
        const fileExists = await exists(fullPath).catch(() => false);
        if (!fileExists) stale.push(key);
      }
      if (stale.length > 0) dispatch(removeDownloadEntries(stale));
      setValidated(true);
    };
    validate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SectionList data: completed entries grouped by bani, plus in-progress queue
  // items. Each bani section lists its related downloads (one row per artist).
  const sections = useMemo(() => {
    const byBani = {};
    // Key on baniId where present; fall back to the stored name for older
    // entries that predate baniId so they still group sensibly.
    const keyFor = (baniId, baniNameUni, baniTitle) =>
      (baniId != null ? `id:${baniId}` : `name:${baniNameUni || baniTitle || 'Unknown'}`);
    const ensureGroup = (key, identity) => {
      if (!byBani[key]) byBani[key] = { ...identity, data: [] };
      return byBani[key];
    };
    Object.entries(downloadRegistry).forEach(([relativePath, entry]) => {
      const key = keyFor(entry.baniId, entry.baniNameUni, entry.baniTitle);
      ensureGroup(key, {
        baniId: entry.baniId,
        baniNameUni: entry.baniNameUni,
        baniTitle: entry.baniTitle,
      }).data.push({
        ...entry,
        artistDisplayName: liveArtistName[relativePath] || entry.artistDisplayName,
        relativePath,
        isQueued: false,
      });
    });
    Object.entries(downloadQueue).forEach(([trackKey, task]) => {
      if (task.status === 'completed') return;
      const key = keyFor(task.baniId, task.baniNameUni, task.baniTitle);
      const group = ensureGroup(key, {
        baniId: task.baniId,
        baniNameUni: task.baniNameUni,
        baniTitle: task.baniTitle,
      });
      if (!group.data.find((t) => t.relativePath === trackKey)) {
        group.data.push({
          relativePath: trackKey,
          artistDisplayName: task.displayName || 'Unknown',
          baniTitle: task.baniTitle || trackKey,
          baniNameUni: task.baniNameUni,
          baniId: task.baniId,
          sizeMB: task.sizeMB ?? 0,
          isQueued: true,
          queueStatus: task.status,
          progress: task.progress ?? 0,
          errorMessage: task.errorMessage ?? null,
        });
      }
    });
    return Object.values(byBani)
      .sort((a, b) => {
        // Canonical bani order by id; nameless/idless entries fall to the end.
        if (a.baniId == null && b.baniId == null) {
          return (a.baniTitle ?? '').localeCompare(b.baniTitle ?? '');
        }
        if (a.baniId == null) return 1;
        if (b.baniId == null) return -1;
        return a.baniId - b.baniId;
      })
      .map((group) => ({
        ...group,
        data: group.data.sort(
          (a, b) => (a.artistDisplayName ?? '').localeCompare(b.artistDisplayName ?? ''),
        ),
      }));
  }, [downloadRegistry, downloadQueue, liveArtistName]);

  const totalTracks = Object.keys(downloadRegistry).length;
  const totalMB = Object.values(downloadRegistry).reduce((s, e) => s + (e.sizeMB ?? 0), 0);

  const selectableKeys = useMemo(() => {
    const keys = [];
    sections.forEach((sec) => sec.data.forEach((item) => { if (!item.isQueued) keys.push(item.relativePath); }));
    return keys;
  }, [sections]);

  const allSelected = selectableKeys.length > 0 && selectableKeys.every((k) => selected.has(k));

  const toggleSelectAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(selectableKeys));
  }, [allSelected, selectableKeys]);

  const toggleSelect = useCallback((key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const confirmDelete = useCallback(() => {
    const keys = [...selected];
    const deletedMB = keys.reduce((s, k) => s + (downloadRegistry[k]?.sizeMB ?? 0), 0);
    const sizeStr = deletedMB > 0 ? ` (${formatMB(deletedMB)} MB)` : '';
    showConfirm({
      title: STRINGS.DELETE_CONFIRM_TITLE,
      message: STRINGS.DELETE_CONFIRM_MESSAGE.replace('{count}', String(keys.length)) + sizeStr,
      cancelText: STRINGS.cancel,
      confirmText: STRINGS.delete,
      destructive: true,
      onConfirm: async () => {
        await Promise.all(keys.map(async (key) => {
          const base = `${AUDIO_DIRECTORY_PATH}/${key}`;
          await unlink(base).catch(() => {});
          await unlink(base.replace(/\.m4a$/, '.json')).catch(() => {});
        }));
        dispatch(removeDownloadEntries(keys));
        setSelected(new Set());
      },
    });
  }, [selected, downloadRegistry, dispatch]);

  const cancelQueueEntry = useCallback((trackKey, displayName) => {
    showConfirm({
      title: STRINGS.CANCEL_DOWNLOAD_TITLE,
      message: STRINGS.CANCEL_DOWNLOAD_BODY.replace('{title}', displayName ?? ''),
      cancelText: STRINGS.CANCEL_DOWNLOAD_KEEP,
      confirmText: STRINGS.CANCEL_DOWNLOAD_CONFIRM,
      destructive: true,
      onConfirm: () => dispatch(removeDownloadQueueEntry(trackKey)),
    });
  }, [dispatch]);

  // Tapping a failed row retries it (matching the player's DownloadButton). A
  // storage failure can't be retried away, so we explain that instead.
  const retryQueueEntry = useCallback((item) => {
    if (item.errorMessage === 'NOT_ENOUGH_STORAGE') {
      showConfirm({
        title: STRINGS.NOT_ENOUGH_STORAGE_TITLE,
        message: STRINGS.NOT_ENOUGH_STORAGE_BODY,
        confirmText: STRINGS.ok,
      });
      return;
    }
    dispatch(retryDownload(item.relativePath));
  }, [dispatch]);

  const queueStatusLabel = (queueStatus) => {
    if (queueStatus === 'downloading') return STRINGS.DOWNLOADING;
    if (queueStatus === 'paused_wifi_only') return STRINGS.DOWNLOAD_PAUSED_WIFI;
    if (queueStatus === 'paused_no_network') return STRINGS.DOWNLOAD_WAITING_NETWORK;
    if (queueStatus === 'failed') return STRINGS.DOWNLOAD_FAILED_RETRY;
    return STRINGS.DOWNLOAD_QUEUED;
  };

  // Header is the bani name, resolved live (script/font follow the user's
  // transliteration/Unicode/fontFace settings) — the section carries the same
  // bani identity fields getDisplayName reads off a row.
  const renderSectionHeader = useCallback(
    ({ section }) => {
      // The top margin separates one bani group from the previous one, so the
      // FIRST heading does not want it — it was stacking on the selection bar's
      // own padding and leaving a large gap before the list started.
      const isFirst = sections[0] === section;
      return (
        <CustomText
          style={[styles.sectionHeader, isFirst && styles.sectionHeaderFirst, nameFontStyle]}
        >
          {getDisplayName(section)}
        </CustomText>
      );
    },
    [styles, getDisplayName, nameFontStyle, sections]
  );

  // `index`/`section` drive the card corners: SectionList can't wrap a section
  // in one view, so the first and last row of each bani carry the rounding and
  // the rows between them are separated by an inset hairline. Same shape as a
  // Settings group.
  const renderItem = useCallback(({ item, index, section }) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;
    const card = [isFirst && styles.cardTop, isLast && styles.cardBottom];

    if (item.isQueued) {
      const isFailed = item.queueStatus === 'failed';
      return (
        <Pressable
          style={[styles.trackRow, ...card, styles.inProgressRow]}
          onPress={() =>
            isFailed
              ? retryQueueEntry(item)
              : cancelQueueEntry(item.relativePath, item.artistDisplayName)
          }
        >
          <View style={styles.trackInfo}>
            <CustomText style={styles.trackName}>{item.artistDisplayName}</CustomText>
            <CustomText style={styles.trackMeta}>
              {queueStatusLabel(item.queueStatus)}
            </CustomText>
          </View>
          {isFailed ? (
            <Icon name="error-outline" type="material" size={layout.icon.sm} color={c.error} />
          ) : (
            // c.accent, not the brand navy: navy is invisible on a dark ground.
            <Spinner size="small" color={c.accent} />
          )}
        </Pressable>
      );
    }

    const isChecked = selected.has(item.relativePath);
    return (
      <Pressable
        style={[styles.trackRow, ...card, isChecked && styles.trackRowChecked]}
        onPress={() => toggleSelect(item.relativePath)}
      >
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && (
            <Icon name="check" type="material" size={layout.icon.xs} color={c.onAccent} />
          )}
        </View>
        <View style={styles.trackInfo}>
          <CustomText style={styles.trackName}>{item.artistDisplayName}</CustomText>
        </View>
        {item.sizeMB > 0 && (
          <CustomText style={styles.trackSize}>{formatMB(item.sizeMB)} MB</CustomText>
        )}
      </Pressable>
    );
  }, [selected, toggleSelect, cancelQueueEntry, styles, c, layout]);

  const isEmpty = sections.length === 0 && validated;

  return (
    <SafeArea backgroundColor={c.backgroundAlt} edges={["bottom", "left", "right"]}>
      <StatusBarComponent backgroundColor={c.backgroundAlt} />

      <ScreenHeader
        title={STRINGS.MANAGE_DOWNLOADS}
        onBack={handleBack}
        backAccessibilityLabel={STRINGS.GO_BACK}
        showBorder={false}
        actions={
          selected.size > 0 ? (
            <Pressable
              onPress={confirmDelete}
              hitSlop={layout.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`${STRINGS.delete} (${selected.size})`}
              style={styles.deleteButton}
            >
              {/* The badge anchors to THIS wrapper, so it hugs the icon's own
                  corner rather than the corner of the 48pt touch target. */}
              <View style={styles.deleteIconWrap}>
                <Icon
                  name="delete-outline"
                  type="material-community"
                  size={layout.icon.md}
                  color={c.error}
                />
                <View style={styles.deleteBadge}>
                  {/* The one place font scaling is capped. The badge is a fixed
                      circle, so a 1.5x digit simply overflows it and sits off
                      centre. The count is not lost to anyone: the Pressable's
                      accessibilityLabel above already announces it. */}
                  <Text style={styles.deleteBadgeText} maxFontSizeMultiplier={1}>
                    {String(selected.size)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : null
        }
      />

      <GradientDivider />

      {/* Selection toolbar: master "select all" on the left, aligned to the row
          checkbox column (same md_12 inset + same checkbox visual as the rows),
          with the totals summary on the right. Delete stays in the app bar. */}
      {(totalTracks > 0 || selectableKeys.length > 0) && (
        <View style={styles.selectionBar}>
          {selectableKeys.length > 0 ? (
            <Pressable
              style={styles.selectAllControl}
              onPress={toggleSelectAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={allSelected ? STRINGS.DESELECT_ALL : STRINGS.SELECT_ALL}
            >
              <View style={[styles.checkbox, allSelected && styles.checkboxChecked]}>
                {allSelected && (
                  <Icon name="check" type="material" size={layout.icon.xs} color={c.onAccent} />
                )}
              </View>
              <CustomText style={styles.selectAllLabel}>
                {allSelected ? STRINGS.DESELECT_ALL : STRINGS.SELECT_ALL}
              </CustomText>
            </Pressable>
          ) : (
            <View />
          )}
          {totalTracks > 0 && (
            <CustomText style={styles.selectionSummary}>
              {STRINGS.TOTAL_DOWNLOADS_LABEL
                .replace('{count}', String(totalTracks))
                .replace('{size}', formatMB(totalMB))}
            </CustomText>
          )}
        </View>
      )}

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="cloud-off"
            type="material"
            size={72}
            color={c.textDisabled}
          />
          <CustomText style={styles.emptyTitle}>{STRINGS.NO_DOWNLOADS}</CustomText>
          <CustomText style={styles.emptyHint}>{STRINGS.DOWNLOAD_OFFLINE_HINT}</CustomText>
        </View>
      ) : (
        <SectionList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => item.relativePath}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          // Between rows of the same bani only — never after the last, so the
          // card's bottom edge stays clean.
          ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeArea>
  );
};

export default ManageDownloads;
