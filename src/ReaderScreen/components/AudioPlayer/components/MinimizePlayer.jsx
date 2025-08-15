import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { colors } from "@common";
import PropTypes from "prop-types";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    right: 20,

    width: "50%",
    height: 100,
    backgroundColor: colors.WHITE_COLOR,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.SHADOW_COLOR || "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  progressContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#113979",
    borderLeftColor: "#f0f0f0",
    transform: [{ rotate: "-90deg" }],
  },
  playPauseButton: {
    position: "absolute",
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
  },
  timestamp: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#113979",
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    color: "#113979",
    fontWeight: "500",
  },
});

const MinimizePlayer = ({ setIsMinimized, handlePlayPause, isPlaying, progress, displayName }) => {
  return (
    <View style={styles.container}>
      <Pressable style={styles.progressContainer} onPress={handlePlayPause}>
        {/* Progress Circle */}
        <View style={styles.progressCircle} />

        {/* Play/Pause Icon */}
        <View style={styles.playPauseButton}>
          <Icon name={isPlaying ? "pause" : "play-arrow"} size={24} color="#113979" />
        </View>
      </Pressable>

      <Pressable style={styles.textContainer} onPress={() => setIsMinimized(false)}>
        <Text style={styles.timestamp}>{progress}</Text>
        <Text style={styles.artistName}>{displayName}</Text>
      </Pressable>
    </View>
  );
};

MinimizePlayer.propTypes = {
  setIsMinimized: PropTypes.func.isRequired,
  handlePlayPause: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  progress: PropTypes.number.isRequired,
  displayName: PropTypes.string.isRequired,
};

export default MinimizePlayer;
