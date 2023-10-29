import { VerifyingKey } from "maci-domainobjs"

export const compareVks = (vk: VerifyingKey, vkOnChain: any): boolean => {
    let isEqual = vk.ic.length === vkOnChain.ic.length
    for (let i = 0; i < vk.ic.length; i ++) {
        isEqual = isEqual && vk.ic[i].x.toString() === vkOnChain.ic[i].x.toString()
        isEqual = isEqual && vk.ic[i].y.toString() === vkOnChain.ic[i].y.toString()
    }
    isEqual = isEqual && vk.alpha1.x.toString() === vkOnChain.alpha1.x.toString()
    isEqual = isEqual && vk.alpha1.y.toString() === vkOnChain.alpha1.y.toString()
    isEqual = isEqual && vk.beta2.x[0].toString() === vkOnChain.beta2.x[0].toString()
    isEqual = isEqual && vk.beta2.x[1].toString() === vkOnChain.beta2.x[1].toString()
    isEqual = isEqual && vk.beta2.y[0].toString() === vkOnChain.beta2.y[0].toString()
    isEqual = isEqual && vk.beta2.y[1].toString() === vkOnChain.beta2.y[1].toString()
    isEqual = isEqual && vk.delta2.x[0].toString() === vkOnChain.delta2.x[0].toString()
    isEqual = isEqual && vk.delta2.x[1].toString() === vkOnChain.delta2.x[1].toString()
    isEqual = isEqual && vk.delta2.y[0].toString() === vkOnChain.delta2.y[0].toString()
    isEqual = isEqual && vk.delta2.y[1].toString() === vkOnChain.delta2.y[1].toString()
    isEqual = isEqual && vk.gamma2.x[0].toString() === vkOnChain.gamma2.x[0].toString()
    isEqual = isEqual && vk.gamma2.x[1].toString() === vkOnChain.gamma2.x[1].toString()
    isEqual = isEqual && vk.gamma2.y[0].toString() === vkOnChain.gamma2.y[0].toString()
    isEqual = isEqual && vk.gamma2.y[1].toString() === vkOnChain.gamma2.y[1].toString()

    return isEqual
}