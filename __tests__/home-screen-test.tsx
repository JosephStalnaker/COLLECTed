import { render, screen } from "@testing-library/react-native";
import HomeScreen from "../src/screens/main/HomeScreen";
import useAuthStore from "../src/store/authStore";

jest.mock("../src/services/auth", () => ({
  logOut: jest.fn(),
}));

describe("HomeScreen", () => {
  it("greets the signed-in user by display name", async () => {
    useAuthStore.setState({
      user: {
        uid: "u1",
        email: "reader@example.com",
        displayName: "Ada",
        photoURL: null,
        createdAt: new Date(),
      },
      isAuthenticated: true,
    });

    await render(<HomeScreen />);

    expect(screen.getByText("Welcome, Ada")).toBeOnTheScreen();
  });
});
