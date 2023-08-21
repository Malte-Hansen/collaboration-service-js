import { Color } from "./color"
import { Controller } from "./controller"

export type User = {
    id: string,
    name: string,
    color: Color
}

export type OtherUser = {
    id: string,
    name: string,
    color: Color,
    controllers: Controller[],
    position: number[],
    quaternion: number[]
}