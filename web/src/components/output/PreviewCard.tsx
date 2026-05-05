import { DefaultLayout } from "../../layouts/DefaultLayout";
import type { GitloreOutput } from "../../types/gitlore";

interface Props {
  data: GitloreOutput;
  onChange?: (updated: GitloreOutput) => void;
}

/**
 * PreviewCard renders the GitloreOutput using the customizable DefaultLayout.
 * To change how the portfolio looks, edit `layouts/DefaultLayout.tsx`.
 */
export function PreviewCard({ data, onChange }: Props) {
  return <DefaultLayout data={data} onChange={onChange} />;
}
