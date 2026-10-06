import { ReactRNPlugin, Rem, CardType, RichTextInterface } from "@remnote/plugin-sdk";

const isCloze = (t?: CardType): t is { clozeId: string } => typeof t === "object" && "clozeId" in t;

async function parse(plugin: ReactRNPlugin, rt?: RichTextInterface, clozeId?: string) {
  return plugin.richText.toString(
    rt?.map((n) =>
      typeof n === "object" && "cId" in n && clozeId && n.cId === clozeId ? "Lücke" : n
    ) || []
  );
}

async function multiline(plugin: ReactRNPlugin, children?: Rem[]) {
  return (await Promise.all((children || []).map((c) => parse(plugin, c.text)))).join(", ");
}

export async function getFrontText(plugin: ReactRNPlugin, rem?: Rem, type?: CardType) {
  if (!rem) return "";
  return isCloze(type)
    ? parse(plugin, (rem.text || []).concat([" "]).concat(rem.backText || []), type.clozeId)
    : parse(plugin, rem.text);
}

export async function getBackText(plugin: ReactRNPlugin, rem?: Rem, type?: CardType) {
  if (!rem) return "";
  const children = await rem.getChildrenRem();
  const isMulti = (await Promise.all((children || []).map((c) => c.isCardItem()))).some(Boolean);
  if (isCloze(type)) return parse(plugin, (rem.text || []).concat([" "]).concat(rem.backText || []));
  return isMulti ? multiline(plugin, children) : parse(plugin, rem.backText);
}

/** Text der Frage bzw. Antwort – abhängig von Kartenrichtung. */
export async function getQuestionAndAnswer(plugin: ReactRNPlugin, cardId: string) {
  const card = await plugin.card.findOne(cardId);
  const rem = card ? await plugin.rem.findOne(card.remId) : undefined;
  const type = card?.type;
  const front = await getFrontText(plugin, rem, type);
  const back = await getBackText(plugin, rem, type);
  const forward = type === "forward" || isCloze(type);
  return { question: forward ? front : back, answer: forward ? back : front };
}
