import NewsFilters from '../components/NewsFilters'
const News = () => {
  return (
    <div className='grid grid-cols-2 grid-rows-3 gap-4 md:grid-cols-5'>
      <NewsFilters />
    </div>
  )
}
export default News
