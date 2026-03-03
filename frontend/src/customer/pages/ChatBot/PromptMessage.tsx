
interface PromptMessageProps{
    message:string,
    index:number
}
const PromptMessage = ({message}:PromptMessageProps) => {
  return (
    <div className='px-3 py-4'>{message}</div>
  )
}

export default PromptMessage