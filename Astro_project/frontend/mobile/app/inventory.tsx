import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AstroLayout from '@/components/layout/AstroLayout';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Colors, Fonts } from '@/constants/theme';
import { INVENTORY_ITEMS } from '@/constants/inventory';

export default function InventoryScreen() {
  const { inventory, useInventoryItem } = useInventoryStore();

  const enrichedInventory = useMemo(() => {
    return inventory.map(userItem => {
      const metadata = INVENTORY_ITEMS.find(i => i.id === userItem.id);
      return {
        ...userItem,
        ...metadata,
      };
    }).filter(item => item.id); // Ensure we only show items we have metadata for
  }, [inventory]);

  const handleUse = async (itemId: number, itemName: string) => {
    Alert.alert(
      'Usar Objeto',
      `¿Deseas activar ${itemName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Activar', 
          onPress: async () => {
            const result = await useInventoryItem(itemId);
            if (result.success) {
              Alert.alert('¡Activado!', `${itemName} está ahora en uso.`);
            } else {
              Alert.alert('Error', result.message || 'No se pudo activar el objeto');
            }
          } 
        },
      ]
    );
  };

  return (
    <AstroLayout>
      <View style={styles.header}>
        <Text style={styles.title}>MI INVENTARIO</Text>
        <Text style={styles.subtitle}>Gestiona tus suministros y equipamiento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {enrichedInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="archive-outline" size={60} color="rgba(255,255,255,0.1)" />
            </View>
            <Text style={styles.emptyText}>Inventario Vacío</Text>
            <Text style={styles.emptySubtext}>Explora la tienda para conseguir objetos útiles para tu entrenamiento.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {enrichedInventory.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.iconBox, { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }]}>
                  <MaterialCommunityIcons 
                    name={(item.icon || 'cube-outline') as any} 
                    size={40} 
                    color={item.color || Colors.dark.tint} 
                  />
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>x{item.quantity}</Text>
                  </View>
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemCat}>{item.cat === 'items' ? 'SUMINISTRO' : 'COSMÉTICO'}</Text>
                </View>

                {item.cat === 'items' ? (
                  <TouchableOpacity 
                    style={styles.useButton} 
                    onPress={() => handleUse(item.id, item.name || 'objeto')}
                  >
                    <MaterialCommunityIcons name="flash" size={14} color={Colors.dark.tint} />
                    <Text style={styles.useButtonText}>ACTIVAR</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.equippedTag}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.equippedText}>COLECCIONABLE</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 25,
  },
  emptyText: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 15,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  quantityBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.dark.tint,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: '#05050a',
  },
  quantityText: {
    color: '#000',
    fontFamily: Fonts.subheader,
    fontSize: 10,
    fontWeight: '900',
  },
  itemInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  itemName: {
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  itemCat: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: Fonts.subheader,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  useButton: {
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
    borderRadius: 12,
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButtonText: {
    color: Colors.dark.tint,
    fontFamily: Fonts.subheader,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  equippedTag: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedText: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: Fonts.subheader,
    fontSize: 10,
    fontWeight: '800',
  },
});
