import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "@rneui/themed";
import Slider from "@react-native-community/slider";
import PropTypes from "prop-types";
import useTrackPlayer from "../../hooks/useTrackPlayer";
import styles from "./style";

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
