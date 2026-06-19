import "styled-components/native";
import { ThemeColors } from "./constants/theme";

declare module "styled-components/native" {
  export interface DefaultTheme extends ThemeColors {}
}
