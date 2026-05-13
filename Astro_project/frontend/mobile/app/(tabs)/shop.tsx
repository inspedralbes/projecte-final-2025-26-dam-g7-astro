import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AstroLayout from '@/components/layout/AstroLayout';
import { useProgressStore } from '@/stores/progressStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Colors, Fonts } from '@/constants/theme';
import { INVENTORY_ITEMS } from '@/constants/inventory';
import i18n from '@/i18n';

const CATEGORIES = [
  { id: 'all', label: i18n.t('shop.categories.all'), icon: 'apps' },
  { id: 'items', label: i18n.t('shop.categories.items'), icon: 'package-variant' },
  { id: 'cosmetics', label: i18n.t('shop.categories.cosmetics'), icon: 'palette' },
];

export default function ShopScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const coins = useProgressStore((state) => state.coins);
  const { inventory, buyItem } = useInventoryStore();

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return INVENTORY_ITEMS;
    if (activeCategory === 'items') return INVENTORY_ITEMS.filter(i => i.cat === 'items');
    if (activeCategory === 'cosmetics') {
      return INVENTORY_ITEMS.filter(i => ['skin', 'pets', 'trails', 'title'].includes(i.cat));
    }
    return INVENTORY_ITEMS;
  }, [activeCategory]);

  const getItemQuantity = (itemId: number) => {
    return inventory.find((i) => i.id === itemId)?.quantity || 0;
  };

  const handleBuy = async (item: any) => {
    if (coins < item.price) {
      Alert.alert(i18n.t('shop.insufficient_funds'), i18n.t('shop.insufficient_funds_msg', { amount: item.price - coins }));
      return;
    }

    if (!item.stackable && getItemQuantity(item.id) > 0) {
      Alert.alert(i18n.t('shop.already_owned'), i18n.t('shop.already_owned_msg'));
      return;
    }

    Alert.alert(
      i18n.t('shop.confirm_purchase'),
      i18n.t('shop.confirm_purchase_msg', { name: item.name, price: item.price }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        { 
          text: i18n.t('common.buy'), 
          onPress: async () => {
            const result = await buyItem(item);
            if (result.success) {
              Alert.alert(i18n.t('common.success'), i18n.t('shop.purchase_success', { name: item.name }));
            } else {
              Alert.alert(i18n.t('common.error'), result.message || i18n.t('common.error'));
            }
          } 
        },
      ]
    );
  };

  return (
    <AstroLayout>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('shop.title')}</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{i18n.t('shop.balance')}</Text>
          <View style={styles.coinRow}>
            <Text style={styles.coinValue}>{coins}</Text>
            <MaterialCommunityIcons name="currency-usd" size={32} color="#ffeb3b" />
          </View>
        </View>
      </View>

      <View style={styles.categoryContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.categoryTab, activeCategory === cat.id && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <MaterialCommunityIcons 
              name={cat.icon as any} 
              size={18} 
              color={activeCategory === cat.id ? '#000' : 'rgba(255,255,255,0.6)'} 
            />
            <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.categoryLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredItems.map(item => {
            const owned = getItemQuantity(item.id);
            const canAfford = coins >= item.price;
            const alreadyOwned = !item.stackable && owned > 0;

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.iconBox, { backgroundColor: `${item.color}20`, borderColor: `${item.color}40` }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
                  {owned > 0 && item.stackable && (
                    <View style={styles.ownedBadge}>
                      <Text style={styles.ownedBadgeText}>x{owned}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>
                </View>

                <TouchableOpacity 
                  style={[
                    styles.buyButton, 
                    (!canAfford || alreadyOwned) && styles.buyButtonDisabled,
                    alreadyOwned && styles.buyButtonOwned
                  ]} 
                  onPress={() => !alreadyOwned && handleBuy(item)}
                  disabled={alreadyOwned}
                >
                  {alreadyOwned ? (
                    <Text style={styles.buyButtonText}>{i18n.t('common.acquired')}</Text>
                  ) : (
                    <>
                      <Text style={styles.buyButtonText}>{item.price}</Text>
                      <MaterialCommunityIcons name="currency-usd" size={14} color="#000" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: Colors.dark.tint,
    fontFamily: Fonts.header,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 242, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Fonts.subheader,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinValue: {
    color: '#ffeb3b',
    fontFamily: Fonts.header,
    fontSize: 32,
    fontWeight: '900',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 15,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Fonts.subheader,
    fontSize: 11,
    fontWeight: '800',
  },
  categoryLabelActive: {
    color: '#000',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  ownedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.dark.tint,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownedBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  itemInfo: {
    alignItems: 'center',
    marginBottom: 15,
    height: 60,
  },
  itemName: {
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.body,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  buyButton: {
    backgroundColor: '#ffeb3b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    gap: 4,
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buyButtonOwned: {
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  buyButtonText: {
    color: '#000',
    fontFamily: Fonts.subheader,
    fontSize: 13,
    fontWeight: '900',
  },
});

