import { DebouncedInput } from './DebouncedInput' // need it to column filtering
import PropTypes from 'prop-types'

export function Filter({ column }) {
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}

  return filterVariant === 'range' ? (
    <div>
      <div className='flex space-x-2'>
        {/* See faceted column filters example for min max values functionality */}
        <DebouncedInput
          type='number'
          value={columnFilterValue?.[0] ?? ''}
          onChange={value => column.setFilterValue(old => [value, old?.[1]])}
          placeholder={`Min`}
          className='w-24 border rounded shadow'
        />
        <DebouncedInput
          type='number'
          value={columnFilterValue?.[1] ?? ''}
          onChange={value => column.setFilterValue(old => [old?.[0], value])}
          placeholder={`Max`}
          className='w-24 border rounded shadow'
        />
      </div>
      <div className='h-1' />
    </div>
  ) : filterVariant === 'select' ? (
    <select
      onChange={e => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}>
      {/* See faceted column filters example for dynamic select options */}
      <option value=''>All</option>
      <option value='complicated'>complicated</option>
      <option value='relationship'>relationship</option>
      <option value='single'>single</option>
    </select>
  ) : (
    <DebouncedInput
      className='w-full border rounded shadow'
      onChange={value => column.setFilterValue(value)}
      placeholder={`Search...`}
      type='text'
      value={columnFilterValue ?? ''}
    />
    // See faceted column filters example for datalist search suggestions
  )
}
Filter.propTypes = {
  column: PropTypes.object.isRequired
}
