import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BreadCrumbs = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Galerie Photos</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default BreadCrumbs;