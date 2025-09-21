import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from "mobx-react-lite";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDirectoriesStore } from "../stores/directories";
import { useMembersStore } from "../stores/members";
import { useMeStore } from "../stores/me";

function Menu() {
    const directoriesStore = useDirectoriesStore();
    const meStore = useMeStore();
    const membersStore = useMembersStore();
    const navigation = useNavigation();
    const route = useRoute();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.menuItem,
                    (route.name === 'RootDirectory' || route.name === 'Directory') && styles.selected
                ]}
                onPress={() => navigation.navigate('RootDirectory' as never)}
            >
                <Text style={styles.menuText}>Galerie</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[
                    styles.menuItem,
                    route.name === 'FaceNames' && styles.selected
                ]}
                onPress={() => navigation.navigate('FaceNames' as never)}
            >
                <Text style={styles.menuText}>Noms des visages</Text>
            </TouchableOpacity>
            
            {membersStore.administrator && (
                <>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setSettingsOpen(!settingsOpen)}
                    >
                        <Text style={styles.menuText}>⚙️ Paramètres</Text>
                        <Text style={styles.expandIcon}>{settingsOpen ? '▼' : '▶'}</Text>
                    </TouchableOpacity>
                    
                    {settingsOpen && (
                        <View style={styles.submenu}>
                            <TouchableOpacity
                                style={[
                                    styles.submenuItem,
                                    route.name === 'GallerySettings' && styles.selected
                                ]}
                                onPress={() => navigation.navigate('GallerySettings' as never)}
                            >
                                <Text style={styles.submenuText}>Galerie</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.submenuItem,
                                    route.name === 'DirectoryVisibilitySettings' && styles.selected
                                ]}
                                onPress={() => navigation.navigate('DirectoryVisibilitySettings' as never)}
                            >
                                <Text style={styles.submenuText}>Visibilité du répertoire</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.submenuItem,
                                    route.name === 'GalleryMembers' && styles.selected
                                ]}
                                onPress={() => navigation.navigate('GalleryMembers' as never)}
                            >
                                <Text style={styles.submenuText}>Membres</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}

            {meStore.administrator && (
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Settings' as never)}
                >
                    <Text style={styles.menuText}>Paramètres globaux</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    submenu: {
        marginLeft: 16,
    },
    submenuItem: {
        padding: 12,
        paddingLeft: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selected: {
        backgroundColor: '#e3f2fd',
    },
    menuText: {
        fontSize: 16,
        color: '#333',
    },
    submenuText: {
        fontSize: 14,
        color: '#666',
    },
    expandIcon: {
        fontSize: 12,
        color: '#999',
    },
});

export default observer(Menu);
