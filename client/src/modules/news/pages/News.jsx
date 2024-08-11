import NewsFilters from '../components/NewsFilters'
const News = () => {
  return (
    <main className='flex flex-col flex-1'>
      <div className='flex-1 p-8 overflow-auto md:p-6'>
        <NewsFilters />
      </div>
    </main>
  )
}
export default News
