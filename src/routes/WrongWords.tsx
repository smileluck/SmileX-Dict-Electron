import WordList from '../components/WordList'

export default function WrongWords() {
  return (
    <WordList
      status="wrong"
      title="错词本"
      emptyText="暂无错词，继续加油！"
      icon="wrong"
      iconClass="text-red-500"
    />
  )
}
