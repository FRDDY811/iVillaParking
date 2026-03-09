import { downloadBlob } from '../../src/utils/download'

describe('downloadBlob', () => {
  it('should create a link, clicks it, and revokes the URL', () => {
    const mockClick = vi.fn()
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const mockRevokeObjectURL = vi.fn()

    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick
    } as unknown as HTMLAnchorElement)

    window.URL.createObjectURL = mockCreateObjectURL
    window.URL.revokeObjectURL = mockRevokeObjectURL

    downloadBlob('file-content', 'export.csv')

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
