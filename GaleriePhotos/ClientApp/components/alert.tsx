import React, { useCallback } from "react";
import {
  Text,
  Modal,
  AlertButton,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

type AlertProps = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => void;

const AlertContext = React.createContext<AlertProps | null>(null);

export const AlertProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const [alert, setAlertState] = React.useState<{
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    title: "",
    message: "",
    buttons: [],
  });

  const setAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setAlertState({ title, message, buttons });
      setOpen(true);
    },
    [setAlertState, setOpen]
  );

  const closeAlert = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const buttonsToRender = alert.buttons?.length
    ? alert.buttons
    : [{ text: "Fermer", style: "cancel" as const }];

  const isColumnLayout = buttonsToRender.length > 2;

  return (
    <AlertContext.Provider value={setAlert}>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            {Boolean(alert.title) && (
              <Text
                style={[
                  styles.title,
                  !alert.message && styles.titleWithoutMessage,
                ]}
              >
                {alert.title}
              </Text>
            )}

            {Boolean(alert.message) && (
              <Text
                style={[
                  styles.message,
                  !alert.title && styles.messageWithoutTitle,
                ]}
              >
                {alert.message}
              </Text>
            )}

            <View
              style={[
                styles.buttonContainer,
                isColumnLayout
                  ? styles.buttonContainerColumn
                  : styles.buttonContainerRow,
              ]}
            >
              {buttonsToRender.map((button, index) => {
                const variantStyle =
                  button.style === "destructive"
                    ? styles.destructiveButton
                    : button.style === "cancel"
                    ? styles.cancelButton
                    : styles.primaryButton;
                const variantTextStyle =
                  button.style === "destructive"
                    ? styles.destructiveButtonText
                    : button.style === "cancel"
                    ? styles.cancelButtonText
                    : styles.primaryButtonText;
                const buttonLabel =
                  button.text ||
                  (button.style === "cancel"
                    ? "Annuler"
                    : button.style === "destructive"
                    ? "Supprimer"
                    : "OK");

                return (
                  <TouchableOpacity
                    key={`${buttonLabel}-${index}`}
                    style={[
                      styles.button,
                      isColumnLayout
                        ? styles.buttonFullWidth
                        : styles.buttonFlex,
                      index > 0 &&
                        (isColumnLayout
                          ? styles.buttonSpacingVertical
                          : styles.buttonSpacingHorizontal),
                      variantStyle,
                    ]}
                    onPress={() => {
                      button.onPress?.();
                      closeAlert();
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.buttonText, variantTextStyle]}>
                      {buttonLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: 320,
    maxWidth: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    marginBottom: 8,
  },
  titleWithoutMessage: {
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  messageWithoutTitle: {
    marginTop: 4,
  },
  buttonContainer: {
    width: "100%",
  },
  buttonContainerRow: {
    flexDirection: "row",
  },
  buttonContainerColumn: {
    flexDirection: "column",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFlex: {
    flex: 1,
  },
  buttonFullWidth: {
    width: "100%",
  },
  buttonSpacingHorizontal: {
    marginLeft: 12,
  },
  buttonSpacingVertical: {
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#007aff",
  },
  primaryButtonText: {
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#333",
  },
  destructiveButton: {
    backgroundColor: "#c62828",
  },
  destructiveButtonText: {
    color: "#fff",
  },
});
