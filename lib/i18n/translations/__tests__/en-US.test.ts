import { enUS } from '../en-US'

describe('en-US translations - upgrade section', () => {
  it('should have all required upgrade translation keys', () => {
    expect(enUS.upgrade).toBeDefined()
    expect(enUS.upgrade.title).toBe('Upgrade to AI Teacher Assistant Premium')
    expect(enUS.upgrade.freeFeatures).toHaveLength(5)
    expect(enUS.upgrade.premiumFeatures).toHaveLength(10)
  })

  it('should not have quarterly plan references', () => {
    const upgradeStr = JSON.stringify(enUS.upgrade)
    expect(upgradeStr).not.toContain('Quarterly')
    expect(upgradeStr).not.toContain('quarter')
  })

  it('should not have social proof keys', () => {
    expect(enUS.upgrade.socialProof).toBeUndefined()
    expect(enUS.upgrade.statEfficiency).toBeUndefined()
  })
})
