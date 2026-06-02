import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import useAuthStore from "../../store/authStore";
import { logOut } from "../../services/auth";

const HomeScreen = () => {
  const { user, setUser } = useAuthStore();

  const handleSignOut = async () => {
    await logOut();
    setUser(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>COLLECTed</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.welcome}>
          Welcome, {user?.displayName ?? "Collector"}
        </Text>
        <Text style={styles.sub}>Your collections will live here.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  signOut: {
    fontSize: 14,
    color: "#666",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: "#999",
  },
});

export default HomeScreen;
