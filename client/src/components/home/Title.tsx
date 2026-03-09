import React from 'react'

interface TitleProps {
  title: string 
  description: string
}
const Title = (props: TitleProps) => {
  return (
    <div className='text-center mt-6 text-slate-700'>
      <h2 className='text-3xl font-medium sm:text-4xl'>
        {props.title}
      </h2>
      <p className='max-sm max-w-2xl mt-4 text-slate-500'>
        {props.description}
      </p>
    </div>
  )
}

export default Title