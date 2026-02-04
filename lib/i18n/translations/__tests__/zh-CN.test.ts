import { zhCN } from '../zh-CN'

describe('zh-CN translations - upgrade section', () => {
  it('should have all required upgrade translation keys', () => {
    expect(zhCN.upgrade).toBeDefined()
    expect(zhCN.upgrade.title).toBe('升级到晨佑AI教学 Premium')
    expect(zhCN.upgrade.freeFeatures).toHaveLength(5)
    expect(zhCN.upgrade.premiumFeatures).toHaveLength(10)
  })

  it('should not have quarterly plan references', () => {
    const upgradeStr = JSON.stringify(zhCN.upgrade)
    expect(upgradeStr).not.toContain('季度')
    expect(upgradeStr).not.toContain('quarter')
  })

  it('should not have social proof keys', () => {
    expect(zhCN.upgrade.socialProof).toBeUndefined()
    expect(zhCN.upgrade.statEfficiency).toBeUndefined()
  })
})
