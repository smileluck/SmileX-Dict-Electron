import WordList from '../components/WordList'

export default function Collections() {
  return (
    <WordList
      status="collected"
      title="收藏"
      emptyText="暂无收藏的单词，练习时点击收藏按钮即可添加"
      icon="star"
      iconClass="text-brand-500"
    />
  )
}
