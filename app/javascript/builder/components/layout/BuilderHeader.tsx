import { useState } from "react"
import Header from "./Header"
import { useAlgorithmNameField } from "../constructor/AlgorithmNameProvider"
import MyAlgorithmsDialog from "../constructor/MyAlgorithmsDialog"

/**
 * The builder's header: the product header wired to the algorithm name held in
 * context, so the name can be edited in one place and read by the save button
 * in another. Signed in, the account menu opens the saved algorithms.
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
  const [algorithmsOpen, setAlgorithmsOpen] = useState(false)

  return (
    <>
      <Header
        title="Construa seu algoritmo"
        userName={userName}
        signedIn={signedIn}
        onOpenAlgorithms={signedIn ? () => setAlgorithmsOpen(true) : undefined}
        algorithmName={algorithmName}
        onAlgorithmNameChange={onAlgorithmNameChange}
        isNameLocked={isNameLocked}
        isNameMissing={isNameMissing}
      />
      {signedIn && (
        <MyAlgorithmsDialog open={algorithmsOpen} onOpenChange={setAlgorithmsOpen} />
      )}
    </>
  )
}
