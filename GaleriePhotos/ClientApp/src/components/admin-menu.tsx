import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from "mobx-react-lite";
import { useNavigation, useRoute } from "@react-navigation/native";

function AdminMenu() {
    const navigation = useNavigation();
    const route = useRoute();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('GalleryChooser' as never)}
            >
                <Text style={styles.menuText}>Retour</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.menuItem,
                    route.name === 'Users' && styles.selected
                ]}
                onPress={() => navigation.navigate('Users' as never)}
            >
                <Text style={styles.menuText}>Utilisateurs</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.menuItem,
                    route.name === 'Galleries' && styles.selected
                ]}
                onPress={() => navigation.navigate('Galleries' as never)}
            >
                <Text style={styles.menuText}>Galeries</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    menuItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    selected: {
        backgroundColor: '#e3f2fd',
    },
    menuText: {
        fontSize: 16,
        color: '#333',
    },
});

export default observer(AdminMenu);
