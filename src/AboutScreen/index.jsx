import React, { useEffect } from "react";
import { Image, Linking, Pressable, ScrollView, View } from "react-native";
import { getBuildNumber, getVersion } from "react-native-device-info";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import {
  constant,
  GradientDivider,
  openInAppBrowser,
  SafeArea,
  StatusBarComponent,
  STRINGS,
} from "@common";
import { ScreenHeader, Text } from "../common/components/ui";

// Migrated onto the design system. What changed, and why:
//
// * The six body-text styles in `styles/index.js` were byte-identical to one
//   another (same colour, size and margins) and are now one `Text` variant.
// * Links used `colors.underlayColor` (#009bff) in BOTH themes, which is
//   2.94:1 on the light surface — a failure. `c.link` resolves per theme.
// * The screen had no ScrollView. On a small phone at a large font setting the
//   footer was simply unreachable; the content now scrolls.
// * The footer row was a fixed two-column layout that squeezed both labels in
//   the longer languages. It wraps now.
// * The logos and the back control were unlabelled, so a screen reader
//   announced nothing for any of them.

const AboutScreen = ({ navigation }) => {
  const { c, space, layout, images } = useTokens();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const openKhalis = () => Linking.openURL(constant.KHALIS_FOUNDATION_URL);
  const openBaniDB = () => Linking.openURL(constant.BANI_DB_URL);
  // In the in-app browser: a policy is read and dismissed, not a site to
  // switch apps for.
  const openPrivacyPolicy = () => openInAppBrowser(constant.KHALIS_PRIVACY_POLICY_URL);

  return (
    <SafeArea backgroundColor={c.background} edges={["bottom"]}>
      <StatusBarComponent backgroundColor={c.background} />
      <ScreenHeader
        title={STRINGS.about}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={STRINGS.GO_BACK}
        showBorder={false}
      />
      {/* The gradient rule every other screen's header sits on. This one was
          drawing a plain hairline instead, which is why it looked different. */}
      <GradientDivider />

      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={{
          padding: layout.screenGutter,
          paddingBottom: layout.screenPaddingBottom,
          gap: space.lg,
        }}
      >
        <Text variant="title">{STRINGS.SUNDAR_GUTKA}</Text>

        <View style={{ gap: space.md, alignItems: "flex-start" }}>
          <Text variant="body">{`${STRINGS.CREATED_BY}:`}</Text>
          <Pressable
            onPress={openKhalis}
            accessibilityRole="link"
            accessibilityLabel={STRINGS.KHALIS_FOUNDATION}
            hitSlop={layout.hitSlop}
          >
            {/* From the theme: the Khalis mark ships a light and a dark file,
                and `contain` keeps its aspect ratio at any width. */}
            <Image
              source={images.khalisLogo}
              style={{ width: 150, height: 60 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </Pressable>
        </View>

        <Text variant="body">{STRINGS.ABOUT_WELCOME}</Text>

        <View style={{ gap: space.xs }}>
          <Text variant="body">{STRINGS.ABOUT_HELP}</Text>
          <Text
            variant="body"
            color="link"
            onPress={openKhalis}
            accessibilityRole="link"
            style={{ textDecorationLine: "underline" }}
          >
            {constant.KHALIS_FOUNDATION_URL}
          </Text>
        </View>

        <Text variant="body">{STRINGS.ABOUT_RESPECT}</Text>

        <Text variant="body">
          {`${STRINGS.ABOUT_SG} `}
          <Text
            variant="body"
            color="link"
            onPress={openBaniDB}
            accessibilityRole="link"
            style={{ textDecorationLine: "underline" }}
          >
            {STRINGS.BANI_DB}
          </Text>
          {` ${STRINGS.ABOUT_OPEN_SOURCE}`}
        </Text>

        <Pressable
          onPress={openBaniDB}
          accessibilityRole="link"
          accessibilityLabel={STRINGS.BANI_DB}
          hitSlop={layout.hitSlop}
          style={{ alignItems: "flex-start" }}
        >
          <Image
            source={images.baniDBLogo}
            style={{ width: 150, height: 40 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Pressable>

        <Text variant="body">{STRINGS.ABOUT_PARDON}</Text>

        {/* A row of its own, not a footnote: the label runs long in the
            non-English languages and the target must stay ≥ 44pt tall. */}
        <Pressable
          onPress={openPrivacyPolicy}
          accessibilityRole="link"
          accessibilityLabel={STRINGS.PRIVACY_POLICY}
          hitSlop={layout.hitSlop}
          style={{
            alignSelf: "flex-start",
            minHeight: layout.touchTarget,
            justifyContent: "center",
          }}
        >
          <Text variant="body" color="link" style={{ textDecorationLine: "underline" }}>
            {STRINGS.PRIVACY_POLICY}
          </Text>
        </Pressable>

        {/* Wraps rather than squeezing: in `fr`/`es` the copyright and the
            version label together exceed one line on a narrow screen. */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: space.sm,
            marginTop: space.md,
            borderTopWidth: layout.borderWidth.hairline,
            borderTopColor: c.border,
            paddingTop: space.md,
          }}
        >
          <Text variant="caption" color="textSecondary">
            {`© ${new Date().getFullYear()} ${STRINGS.KHALIS_FOUNDATION}`}
          </Text>
          <Text variant="caption" color="textSecondary">
            {`${STRINGS.APP_VERSION}: ${getVersion()} (${getBuildNumber()})`}
          </Text>
        </View>
      </ScrollView>
    </SafeArea>
  );
};

AboutScreen.propTypes = { navigation: PropTypes.shape().isRequired };

export default AboutScreen;
