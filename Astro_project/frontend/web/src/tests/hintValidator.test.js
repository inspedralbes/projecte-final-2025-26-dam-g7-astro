import { describe, expect, it } from 'vitest'
import { generateAntiCheatRegex, isValidHint, normalizeText } from '../utils/hintValidator'

describe('hintValidator', () => {
  describe('normalizeText', () => {
    it('should convert to lowercase and remove accents', () => {
      expect(normalizeText('Árbol')).toBe('arbol')
      expect(normalizeText('ÉXITO')).toBe('exito')
    })

    it('should remove symbols and spaces', () => {
      expect(normalizeText('S.O.L')).toBe('sol')
      expect(normalizeText('Luna ')).toBe('luna')
      expect(normalizeText('Estrella-Fugaz')).toBe('estrellafugaz')
    })
  })

  describe('generateAntiCheatRegex', () => {
    it('should generate a regex with gaps', () => {
      const regex = generateAntiCheatRegex('sol')
      expect(regex.test('sol')).toBe(true)
      expect(regex.test('s.o.l')).toBe(true)
      expect(regex.test('s o l')).toBe(true)
      expect(regex.test('sxoxl')).toBe(true)
      expect(regex.test('s--o--l')).toBe(true)
    })
  })

  describe('isValidHint', () => {
    const secret = 'ASTEROIDE'

    it('should allow valid hints', () => {
      expect(isValidHint('Roca espacial', secret)).toBe(true)
      expect(isValidHint('Cinturón', secret)).toBe(true)
    })

    it('should block exact word', () => {
      expect(isValidHint('asteroide', secret)).toBe(false)
      expect(isValidHint('Ásteroide ', secret)).toBe(false)
    })

    it('should block obfuscated word', () => {
      expect(isValidHint('A.S.T.E.R.O.I.D.E', secret)).toBe(false)
      expect(isValidHint('AxS xTxExRxOxIxDxE', secret)).toBe(false)
    })
  })
})
