import Header from "./Header"
import { useAlgorithmNameField } from "../constructor/AlgorithmNameProvider"

/**
 * The builder's header: the product header wired to the algorithm name held in
 * context, so the name can be edited in one place and read by the save button
 * in another.
 */
export function BuilderHeader({
  userName = null,
  signedIn = false,
}: {
  userName?: string | null
  signedIn?: boolean
}) {
  const { algorithmName, onAlgorithmNameChange, isNameLocked, isNameMissing } =
    useAlgorithmNameField()

  return (
    <Header
      title="Construa seu algoritmo"
      userName={userName}
      signedIn={signedIn}
      algorithmName={algorithmName}
      onAlgorithmNameChange={onAlgorithmNameChange}
      isNameLocked={isNameLocked}
      isNameMissing={isNameMissing}
    />
  )
}