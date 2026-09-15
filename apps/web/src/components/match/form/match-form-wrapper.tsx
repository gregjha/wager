import type { MatchDetailDTO } from "@bi/shared";

import { MatchForm } from "./match-form";

interface CreateProps {
  formMode: "create";
  initialMatch?: never;
}

interface EditProps {
  formMode: "update";
  initialMatch: MatchDetailDTO;
}

type Props = Readonly<CreateProps | EditProps>;

export function MatchFormWrapper({ formMode, initialMatch }: Props) {
  return (
    <div className="mx-auto px-4 py-8 max-w-3xl">
      <h1 className="mb-6 text-5xl font-bold">
        {formMode === "update" ? "Edit match" : "Host a match"}
      </h1>
      <MatchForm initialMatch={initialMatch} type={formMode} />
    </div>
  );
}
