import {Dimensions, Image, Modal, Pressable, StyleSheet, Text, View} from "react-native";
import {useThemeColors} from "@/hooks/useThemeColors";
import {useRef, useState} from "react";
import ThemedText from "@/components/ThemedText";
import Card from "@/components/Card";
import Row from "@/components/Row";
import Radio from "@/components/Radio";
import {Shadows} from "@/constants/shadows";

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 32,
    flex: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popup: {
    padding: 4,
    paddingTop: 16,
    gap: 16,
    borderRadius: 12,
    position: 'absolute',
    width: 113,
    ...Shadows.dp2
  },
  title: {
    paddingLeft: 20
  },
  card: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  }
})

type SortButtonProps = {
  value: 'id' | 'name',
  onChange: (value: 'id' | 'name') => void,
}


const SortButton = ({ value, onChange }: SortButtonProps ) => {
  const buttonRef = useRef<View>(null)
  const colors = useThemeColors()
  const [position, setPosition] = useState<null | { top: number, right: number }>(null)
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const onOpen = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setPosition({
        top: y + height,
        right: Dimensions.get("window").width - x - width,
      })
      setIsModalVisible(true)
    })
  }
  const onClose = () => {
    setIsModalVisible(false)
  }

  const options = [
    { label: "Number", value: "id" },
    { label: "Nom", value: "name" },
  ] as const

  return (
    <>
      <Pressable onPress={onOpen}>
        <View style={[styles.button, { backgroundColor: colors.grayWhite}]} ref={buttonRef}>
          <Image source={value === 'id' ? require('@/assets/images/number.png') : require('@/assets/images/alpha.png') } width={16} height={16} />
        </View>
      </Pressable>
      <Modal transparent visible={isModalVisible} onRequestClose={onClose} animationType={'fade'}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={[styles.popup, { backgroundColor: colors.tint, ...position }]}>
            <ThemedText variante='subtitle2' color='grayWhite' style={styles.title}>Sort by:</ThemedText>
            <Card style={styles.card}>
              {
                options.map((option) => (
                  <Pressable onPress={() => onChange(option.value)} key={option.value}>
                    <Row gap={8}>
                      <Radio checked={option.value === value} />
                      <ThemedText>{ option.label}</ThemedText>
                    </Row>
                  </Pressable>
                ))
              }
            </Card>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

export default SortButton
