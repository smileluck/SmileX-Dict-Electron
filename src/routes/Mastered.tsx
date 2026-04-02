import WordList from '../components/WordList'

export default function Mastered() {
  return (
    <WordList
      status="mastered"
      title="已掌握"
      emptyText="暂无已掌握的单词，继续学习吧！"
      icon="check"
      iconClass="text-green-500"
    />
  )
}
