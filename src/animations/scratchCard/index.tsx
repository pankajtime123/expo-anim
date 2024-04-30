/* eslint-disable react-native/no-inline-styles */
import {
  Blur,
  Canvas,
  Group,
  Image,
  Paint,
  Path,
  RoundedRect,
  Shadow,
  SkPath,
  Skia,
  Transforms3d,
  notifyChange,
  rect,
  rrect,
  useCanvasRef,
  useImage,
} from '@shopify/react-native-skia';
import {
  MutableRefObject,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withReanimatedTimer,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AdvancedButtonComponent from '../../components/AdvancedButtonComponent';
import {UI_VALUES} from '../../constants/Constants';
import {
  TEXT_PARA_BOLD,
  TEXT_PARA_MED,
} from '../../constants/TextStyles';
import {VoidFn} from '../FlashFlip/constants';

const AnimCanva =
  Animated.createAnimatedComponent(Canvas);

const giftI = require('./gift.png');
const coverI = require('./c0.jpeg');
const backgroundI = require('./background.jpg');

let x = UI_VALUES.screenWid / 4;
let y = 155;
let w = UI_VALUES.screenWid - 2 * x;
let h = w * 1.5;
let clipRect = rect(x, y, w, h);
let clipRRect = rrect(clipRect, 16, 16);
let scale = 1 / 10;

let scaleAtReveal = (UI_VALUES.screenWid - x) / w;

type GetC = MutableRefObject<{
  getC?: () => number;
}>;

export default function ScratchCardComponent() {
  const path = useSharedValue(Skia.Path.Make());
  const gift = useImage(giftI);
  const cover = useImage(coverI);
  const background = useImage(backgroundI);
  const getC: GetC = useRef({});
  const strokeWidth = useSharedValue(50);
  const revealProgress = useSharedValue(0);
  const glow = useSharedValue(0);
  const [scratchedArea, setScratchedArea] =
    useState(0);

  const reveal = () => {
    strokeWidth.value = withTiming(
      h,
      {
        duration: 1000,
      },
      done => {
        if (done) {
          revealProgress.value = withSpring(1);
          runOnJS(setScratchedArea)(1);
          glow.value = withSequence(
            withSpring(3),
            withRepeat(
              withTiming(18, {duration: 1000}),
              -1,
              true,
            ),
          );
        }
      },
    );
  };

  const reset = () => {
    path.value = Skia.Path.Make();
    setScratchedArea(0);
    strokeWidth.value = 50;
    glow.value = withTiming(0);
    revealProgress.value = withSpring(0, {
      overshootClamping: true,
    });
  };

  const readColor = () => {
    let covredFraction =
      getC.current?.getC?.() || 0;
    setScratchedArea(covredFraction);
    if (covredFraction > 0.75) {
      reveal();
    }
  };

  const gesture = Gesture.Pan()
    .onBegin(e => {
      path.value.moveTo(e.x, e.y);
      path.value.lineTo(e.x, e.y);
      notifyChange(path);
    })
    .onChange(e => {
      path.value = path.value.lineTo(e.x, e.y);
      notifyChange(path);
    })
    .onFinalize(() => {
      runOnJS(readColor)();
    });

  const tfs =
    useDerivedValue<Transforms3d>(() => {
      return [
        {
          scale:
            1 +
            revealProgress.value *
              (scaleAtReveal - 1),
        },
        {
          translateY: revealProgress.value * 6,
        },
      ];
    }, [revealProgress]);

  return (
    <>
      <GestureDetector gesture={gesture}>
        <AnimCanva
          style={{
            width: UI_VALUES.screenWid,
            height: UI_VALUES.screenHei,
            backgroundColor: 'black',
          }}>
          <Image
            opacity={0.1}
            fit="cover"
            image={background}
            rect={rect(
              0,
              0,
              UI_VALUES.screenWid,
              UI_VALUES.screenHei,
            )}
          />
          <Group
            origin={{
              x: UI_VALUES.screenWid / 2,
              y: y + h / 2,
            }}
            transform={tfs}>
            <RoundedRect
              rect={clipRRect}
              color={'#ffffff'}>
              <Blur blur={glow} />
            </RoundedRect>
            <Image
              clip={clipRRect}
              image={gift}
              rect={clipRect}
              fit={'cover'}
            />
            <Group clip={clipRRect}>
              <Group
                layer={
                  <Paint>
                    <Shadow
                      dx={0}
                      dy={0}
                      color={'black'}
                      blur={10}
                    />
                  </Paint>
                }>
                <Image
                  image={cover}
                  rect={clipRect}
                  fit={'cover'}
                />
                <Path
                  style={'stroke'}
                  strokeWidth={strokeWidth}
                  strokeCap={'round'}
                  strokeJoin={'round'}
                  path={path}
                  color={'white'}
                  blendMode={'clear'}
                />
              </Group>
            </Group>
          </Group>
        </AnimCanva>
      </GestureDetector>
      <CC getC={getC} path={path} />
      <RNComps
        reveal={reveal}
        reset={reset}
        area={scratchedArea}
      />
    </>
  );
}

const CC = ({
  path,
  getC,
}: {
  path: SharedValue<SkPath>;
  getC: GetC;
}) => {
  const ref = useCanvasRef();
  const getAvgColor = () => {
    let pixels =
      ref.current
        ?.makeImageSnapshot()
        ?.readPixels() ?? [];

    let redSum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      redSum += pixels[i];
    }
    let redSumAvg = redSum / (pixels.length / 4);
    return redSumAvg / 255;
  };
  getC.current.getC = getAvgColor;
  return (
    <Canvas
      ref={ref}
      style={{
        width: w * scale,
        height: h * scale,
        position: 'absolute',
        opacity: 0,
      }}>
      <Path
        transform={[
          {scale},
          {translateX: -x},
          {translateY: -y},
        ]}
        style={'stroke'}
        strokeWidth={50}
        color={'white'}
        strokeCap={'round'}
        strokeJoin={'round'}
        path={path}
      />
    </Canvas>
  );
};

const RNComps = ({
  area,
  reveal,
  reset,
}: {
  area: number;
  reveal: VoidFn;
  reset: VoidFn;
}) => {
  return (
    <View style={styles.rnCont}>
      <View style={styles.row}>
        <Text style={styles.textR}>
          Scratched Area:{'  '}
          <Text style={styles.textB}>
            {(area * 100).toFixed(2)}
          </Text>{' '}
          %
        </Text>
      </View>
      <View style={styles.btnCont}>
        <AdvancedButtonComponent
          onPress={reset}
          text="Reset"
          style={styles.btn}
          icon={{
            set: 'Feather',
            code: 'skip-back',
            size: 20,
          }}
          textStyles={styles.btnT}
        />
        <AdvancedButtonComponent
          onPress={reveal}
          text="Reveal"
          icon={{
            set: 'Feather',
            code: 'skip-forward',
            size: 20,
          }}
          style={styles.btn}
          textStyles={styles.btnT}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  textR: {
    ...TEXT_PARA_MED,
    color: 'black',
  },
  textB: {
    ...TEXT_PARA_BOLD,
    fontSize: 30,
    color: 'black',
  },
  rnCont: {
    position: 'absolute',
    width: UI_VALUES.screenWid,
    bottom: 0,
    gap: 16,
    padding: 16,
    paddingTop: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  btn: {
    flex: 1,
    height: 60,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 12,
    flexDirection: 'row-reverse',
  },
  btnT: {
    ...TEXT_PARA_MED,
    top: -1,
  },
  btnCont: {
    flexDirection: 'row',
    gap: 16,
  },
});
