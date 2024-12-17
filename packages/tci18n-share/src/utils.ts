
// 拆分key
export const splitKey = (key: string) => {
    if (key.indexOf('#!!!#') > -1) {
        const [value, filePathIndex] = key.split('#!!!#')
        let filePath = ''
        let index = ''
        if (filePathIndex) {
            const splitIndex = filePathIndex.lastIndexOf('_')
            filePath = filePathIndex.slice(0, splitIndex)
            index = filePathIndex.slice(splitIndex + 1)
        }
        return [value, filePath, index]
    }
    return [key, '', '']
}