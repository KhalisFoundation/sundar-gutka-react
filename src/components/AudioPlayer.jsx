import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "@rneui/themed";
import Slider from "@react-native-community/slider";
import PropTypes from "prop-types";
import useTrackPlayer from "../hooks/useTrackPlayer";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trackInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  artist: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    minWidth: 40,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButton: {
    padding: 10,
    marginHorizontal: 20,
  },
  playButton: {
    backgroundColor: "#1976d2",
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledPlayButton: {
    backgroundColor: "#ccc",
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledText: {
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 10,
  },
});

const AudioPlayer = ({ audioUrl, title, artist }) => {
  const { isPlaying, progress, play, pause, stop, addAndPlayTrack, seekTo, isAudioEnabled } =
    useTrackPlayer();

  const handlePlayPause = async () => {
    if (!isAudioEnabled) {
      return;
    }

    if (isPlaying) {
      await pause();
    } else if (audioUrl && title) {
      // Add track if not playing
      const track = {
        id: Date.now().toString(),
        url: audioUrl,
        title: title || "Unknown Title",
        artist: artist || "Unknown Artist",
        duration: 0, // Will be updated by the player
      };
      await addAndPlayTrack(track);
    } else {
      await play();
    }
  };

  const handleSeek = async (value) => {
    if (!isAudioEnabled) {
      return;
    }
    await seekTo(value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.trackInfo}>
        {!isAudioEnabled && (
          <Text style={styles.disabledText}>
            Audio is disabled. Enable it in Settings to play audio.
          </Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={progress.duration}
          value={progress.position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={isAudioEnabled ? "#1976d2" : "#ccc"}
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor={isAudioEnabled ? "#1976d2" : "#ccc"}
          disabled={!isAudioEnabled}
        />
        <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={stop} style={styles.controlButton} disabled={!isAudioEnabled}>
          <Icon name="stop" size={30} color={isAudioEnabled} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={[isAudioEnabled, { opacity: 0.7 }]}
          disabled={!isAudioEnabled}
        >
          <Icon name={isPlaying ? "pause" : "play-arrow"} size={40} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} disabled={!isAudioEnabled}>
          <Icon name="skip-next" size={30} color={isAudioEnabled} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

AudioPlayer.propTypes = {
  audioUrl: PropTypes.string,
  title: PropTypes.string,
  artist: PropTypes.string,
};

AudioPlayer.defaultProps = {
  audioUrl: "",
  title: "Audio Track",
  artist: "Unknown Artist",
};

export default AudioPlayer;
